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

import { readFile, writeFile } from 'fs/promises';

const MAGIC = Buffer.from([0xFC, 0xAA, 0x55, 0xA7]);
const BUFFER_SIZE = 0x1FFF;

/**
 * Circular buffer for LZ decompression
 */
class CircularBuffer {
  constructor(size) {
    this.buffer = Buffer.alloc(size);
    this.position = 0;
    this.length = size;
  }

  writeByte(value) {
    this.buffer[this.position % this.length] = value;
    this.position++;
  }

  /**
   * Copy data from a previous position in the buffer
   * @param {number} displacement - How far back to look
   * @param {number} length - How many bytes to copy
   * @returns {Buffer} - The copied bytes
   */
  copy(displacement, length) {
    const result = Buffer.alloc(length);
    let readPos = this.position - displacement;

    for (let i = 0; i < length; i++) {
      const value = this.buffer[(readPos + i) % this.length];
      result[i] = value;
      this.writeByte(value);
    }

    return result;
  }
}

/**
 * Decompress Spike Chunsoft compressed data
 * @param {Buffer} input - Compressed data with header
 * @returns {Buffer} - Decompressed data
 */
export function decompress(input) {
  // Validate magic
  if (!input.slice(0, 4).equals(MAGIC)) {
    throw new Error(`Invalid magic bytes. Expected FC AA 55 A7, got ${input.slice(0, 4).toString('hex')}`);
  }

  const decompressedSize = input.readUInt32LE(4);
  const compressedSize = input.readUInt32LE(8);

  // Decompress the data starting after the 12-byte header
  return decompressHeaderless(input.slice(12), decompressedSize);
}

/**
 * Decompress headerless Spike Chunsoft data
 * @param {Buffer} input - Compressed data without header
 * @param {number} decompressedSize - Expected output size
 * @returns {Buffer} - Decompressed data
 */
export function decompressHeaderless(input, decompressedSize) {
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
      const displacement = ((flag & 0x1F) << 8) | input[inputPos++];

      previousDisplacement = displacement;
      const copied = circularBuffer.copy(displacement, length);
      copied.copy(output, outputPos);
      outputPos += length;
    }
    else if ((flag & 0x60) === 0x60) {
      // LZ match continue (reuse previous displacement)
      // Length: 0-0x1F bytes
      const length = flag & 0x1F;

      const copied = circularBuffer.copy(previousDisplacement, length);
      copied.copy(output, outputPos);
      outputPos += length;
    }
    else if ((flag & 0x40) === 0x40) {
      // RLE data
      // Length: 4-0x1003 bytes
      let length;
      if ((flag & 0x10) === 0x00) {
        length = (flag & 0x0F) + 4;
      } else {
        length = ((flag & 0x0F) << 8) + input[inputPos++] + 4;
      }

      const value = input[inputPos++];
      for (let i = 0; i < length; i++) {
        output[outputPos++] = value;
        circularBuffer.writeByte(value);
      }
    }
    else {
      // Raw data
      // Length: 0-0x1FFF bytes
      let length;
      if ((flag & 0x20) === 0x00) {
        length = flag & 0x1F;
      } else {
        length = ((flag & 0x1F) << 8) + input[inputPos++];
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

/**
 * Check if data is Spike Chunsoft compressed
 * @param {Buffer} data - Data to check
 * @returns {boolean}
 */
export function isCompressed(data) {
  if (data.length < 12) return false;
  return data.slice(0, 4).equals(MAGIC);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`Usage: spike-chunsoft-decompress.js <input> [output]

Decompresses Spike Chunsoft (ShadeLz) compressed files.
Magic: FC AA 55 A7

Arguments:
  input    Path to compressed file
  output   Path to output file (default: input + '.dec')

Example:
  node spike-chunsoft-decompress.js texture.gxt texture_decompressed.gxt`);
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath + '.dec';

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
    console.log(`First 16 bytes: ${output.slice(0, 16).toString('hex')}`);

    // Try to identify the decompressed format
    const magic = output.slice(0, 4);
    if (magic.toString('ascii').startsWith('GXT')) {
      console.log(`Detected format: GXT (PS Vita texture)`);
    } else if (magic.toString('ascii').startsWith('OMG.')) {
      console.log(`Detected format: GMO (3D model)`);
    } else {
      console.log(`Magic bytes: ${magic.toString('hex')} (${magic.toString('ascii').replace(/[^\x20-\x7E]/g, '.')})`);
    }

  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
