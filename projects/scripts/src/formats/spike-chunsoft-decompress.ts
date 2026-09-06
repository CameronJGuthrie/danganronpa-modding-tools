#!/usr/bin/env node

/**
 * Spike Chunsoft Compression (ShadeLz) Decompressor
 *
 * Used in Danganronpa PS Vita games for compressing various file types including GXT textures.
 *
 * Format:
 * - Magic: FC AA 55 A7 (4 bytes)
 * - Decompressed size: uint32 LE (4 bytes)
 * - Compressed size: uint32 LE (4 bytes)
 * - Compressed data stream
 *
 * Based on Kuriimu2's ShadeLzDecoder implementation.
 * Reference: https://github.com/FanTranslatorsInternational/Kuriimu2
 */

import { readFile, writeFile } from "node:fs/promises";
import { errorMessage } from "../lib/errors.ts";

const MAGIC = Buffer.from([0xfc, 0xaa, 0x55, 0xa7]);
const BUFFER_SIZE = 0x1fff;

/**
 * Circular buffer for LZ decompression
 */
class CircularBuffer {
  private readonly buffer: Buffer;
  private position: number;
  private readonly length: number;

  constructor(size: number) {
    this.buffer = Buffer.alloc(size);
    this.position = 0;
    this.length = size;
  }

  writeByte(value: number): void {
    this.buffer[this.position % this.length] = value;
    this.position++;
  }

  /**
   * Copy data from a previous position in the buffer.
   * `displacement` is how far back to look, `length` how many bytes to copy.
   */
  copy(displacement: number, length: number): Buffer {
    const result = Buffer.alloc(length);
    const readPos = this.position - displacement;

    for (let i = 0; i < length; i++) {
      const value = this.buffer[(readPos + i) % this.length];
      result[i] = value;
      this.writeByte(value);
    }

    return result;
  }
}

/** Decompress Spike Chunsoft compressed data (including its 12-byte header). */
export function decompress(input: Buffer): Buffer {
  // Validate magic
  if (!input.slice(0, 4).equals(MAGIC)) {
    throw new Error(`Invalid magic bytes. Expected FC AA 55 A7, got ${input.slice(0, 4).toString("hex")}`);
  }

  const decompressedSize = input.readUInt32LE(4);
  const _compressedSize = input.readUInt32LE(8);

  // Decompress the data starting after the 12-byte header
  return decompressHeaderless(input.slice(12), decompressedSize);
}

/** Decompress headerless Spike Chunsoft data into a buffer of `decompressedSize` bytes. */
export function decompressHeaderless(input: Buffer, decompressedSize: number): Buffer {
  const output = Buffer.alloc(decompressedSize);
  const circularBuffer = new CircularBuffer(BUFFER_SIZE);

  let inputPos = 0;
  let outputPos = 0;
  let previousDisplacement = 0;

  while (outputPos < decompressedSize && inputPos < input.length) {
    const flag = input[inputPos++];

    if ((flag & 0x80) === 0x80) {
      // LZ match start
      // Length: 4-7 bytes
      // Displacement: 0-0x1FFF
      const length = ((flag >> 5) & 0x3) + 4;
      const displacement = ((flag & 0x1f) << 8) | input[inputPos++];

      previousDisplacement = displacement;
      const copied = circularBuffer.copy(displacement, length);
      copied.copy(output, outputPos);
      outputPos += length;
    } else if ((flag & 0x60) === 0x60) {
      // LZ match continue (reuse previous displacement)
      // Length: 0-0x1F bytes
      const length = flag & 0x1f;

      const copied = circularBuffer.copy(previousDisplacement, length);
      copied.copy(output, outputPos);
      outputPos += length;
    } else if ((flag & 0x40) === 0x40) {
      // RLE data
      // Length: 4-0x1003 bytes
      let length: number;
      if ((flag & 0x10) === 0x00) {
        length = (flag & 0x0f) + 4;
      } else {
        length = ((flag & 0x0f) << 8) + input[inputPos++] + 4;
      }

      const value = input[inputPos++];
      for (let i = 0; i < length; i++) {
        output[outputPos++] = value;
        circularBuffer.writeByte(value);
      }
    } else {
      // Raw data
      // Length: 0-0x1FFF bytes
      let length: number;
      if ((flag & 0x20) === 0x00) {
        length = flag & 0x1f;
      } else {
        length = ((flag & 0x1f) << 8) + input[inputPos++];
      }

      for (let i = 0; i < length; i++) {
        const value = input[inputPos++];
        output[outputPos++] = value;
        circularBuffer.writeByte(value);
      }
    }
  }

  return output;
}

/** Check if data carries the Spike Chunsoft compression magic. */
export function isCompressed(data: Buffer): boolean {
  if (data.length < 12) return false;
  return data.slice(0, 4).equals(MAGIC);
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`Usage: spike-chunsoft-decompress.ts <input> [output]

Decompresses Spike Chunsoft (ShadeLz) compressed files.
Magic: FC AA 55 A7

Arguments:
  input    Path to compressed file
  output   Path to output file (default: input + '.dec')

Example:
  node spike-chunsoft-decompress.ts texture.gxt texture_decompressed.gxt`);
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || `${inputPath}.dec`;

  try {
    const input = await readFile(inputPath);

    if (!isCompressed(input)) {
      console.error(`Error: File does not have Spike Chunsoft compression magic (FC AA 55 A7)`);
      process.exit(1);
    }

    console.log(`Input: ${inputPath}`);
    console.log(`Compressed size: ${input.length} bytes`);
    console.log(`Expected decompressed size: ${input.readUInt32LE(4)} bytes`);

    const output = decompress(input);

    await writeFile(outputPath, output);
    console.log(`Output: ${outputPath}`);
    console.log(`Decompressed size: ${output.length} bytes`);

    // Show first few bytes of decompressed data
    console.log(`First 16 bytes: ${output.slice(0, 16).toString("hex")}`);

    // Try to identify the decompressed format
    const magic = output.slice(0, 4);
    if (magic.toString("ascii").startsWith("GXT")) {
      console.log(`Detected format: GXT (PS Vita texture)`);
    } else if (magic.toString("ascii").startsWith("OMG.")) {
      console.log(`Detected format: GMO (3D model)`);
    } else {
      console.log(`Magic bytes: ${magic.toString("hex")} (${magic.toString("ascii").replace(/[^\x20-\x7E]/g, ".")})`);
    }
  } catch (err) {
    console.error(`Error: ${errorMessage(err)}`);
    process.exit(1);
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
