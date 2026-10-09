#!/usr/bin/env node

/**
 * TGA to PNG Converter
 *
 * Converts the game's Truevision TGA textures to PNG so they can be viewed with ordinary image
 * tools. The TGA is decoded with the `tga` package (the same decoder the GUI uses) and encoded
 * with `sharp`. The extraction scripts (`lib/extract-tree.ts`) run this over every `.tga` of an
 * extracted WAD through a pool of worker threads (`tga-to-png.worker.ts`), replacing each
 * `name.tga` with `name.tga.png`.
 */

import { readFile } from "node:fs/promises";
import sharp from "sharp";
import TGA from "tga";
import { errorMessage } from "../lib/errors.ts";

/** Output path for a `.tga`: the same name with `.png` appended, so `0001.tga` -> `0001.tga.png`. */
export function pngPathFor(tgaPath: string): string {
  return `${tgaPath}.png`;
}

/** Image types of the TGA header: uncompressed and run-length encoded colour-mapped, true-colour and grey. */
const TGA_IMAGE_TYPES: ReadonlySet<number> = new Set([1, 2, 3, 9, 10, 11]);
const TGA_PIXEL_DEPTHS: ReadonlySet<number> = new Set([8, 15, 16, 24, 32]);

/**
 * Whether `buffer` starts with a plausible TGA header. The format has no magic number, and the
 * pak extractor names some entries `.tga` that are not textures (nested archives, mostly), so
 * the image type and pixel depth bytes are checked before decoding.
 */
export function isTgaImage(buffer: Buffer): boolean {
  return buffer.length >= 18 && TGA_IMAGE_TYPES.has(buffer[2]) && TGA_PIXEL_DEPTHS.has(buffer[16]);
}

/** Thrown by `convertTgaToPng` for a file that is not a TGA image. */
export class NotTgaError extends Error {
  constructor(path: string) {
    super(`${path} is not a TGA image`);
    this.name = "NotTgaError";
  }
}

/** Decode `tgaPath` and write it as a PNG to `pngPath`; throws `NotTgaError` if the file is not a TGA. */
export async function convertTgaToPng(tgaPath: string, pngPath = pngPathFor(tgaPath)): Promise<void> {
  const buffer = await readFile(tgaPath);
  if (!isTgaImage(buffer)) {
    throw new NotTgaError(tgaPath);
  }
  const tga = new TGA(buffer);
  await sharp(Buffer.from(tga.pixels.buffer, tga.pixels.byteOffset, tga.pixels.byteLength), {
    raw: { width: tga.width, height: tga.height, channels: 4 },
  })
    .png()
    .toFile(pngPath);
}

// ============================================================================
// CLI
// ============================================================================

function showUsage(): void {
  console.log(`Usage: tga-to-png.ts <file.tga> [output.png]

Converts one TGA to PNG; the output defaults to <file.tga>.png next to the input.
Whole extracted WADs are converted by the setup scripts (pnpm run reset, extract-recursive).`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    return;
  }
  const [tgaPath, pngPath = pngPathFor(tgaPath)] = args;
  await convertTgaToPng(tgaPath, pngPath);
  console.log(`Wrote ${pngPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exit(1);
  });
}
