#!/usr/bin/env node

/**
 * GXT to PNG Converter
 *
 * Converts PS Vita GXT texture files to PNG images.
 * Supports I8 (8-bit indexed) format with Vita swizzle.
 *
 * Based on analysis of Kuriimu2's GXT plugin and VitaSwizzle implementation.
 */

import { readFile, mkdir } from 'fs/promises';
import { dirname, basename, join } from 'path';
import sharp from 'sharp';

// GXT Format constants
const GXT_MAGIC = 'GXT\0';
const HEADER_SIZE = 0x20;
const ENTRY_SIZE_V3 = 0x20;

// Format types
const FORMAT_I4 = 0x94000000;  // 4-bit indexed
const FORMAT_I8 = 0x95000000;  // 8-bit indexed
const FORMAT_DXT1 = 0x85000000;

// Swizzle types
const TYPE_SWIZZLED = 0x00000000;
const TYPE_LINEAR = 0x60000000;

/**
 * Parse GXT file header
 */
function parseHeader(buffer) {
  const magic = buffer.toString('ascii', 0, 4);
  if (magic !== GXT_MAGIC) {
    throw new Error(`Invalid GXT magic: ${magic}`);
  }

  return {
    magic,
    version: buffer.readUInt32LE(4),
    texCount: buffer.readInt32LE(8),
    dataOffset: buffer.readInt32LE(12),
    dataSize: buffer.readInt32LE(16),
    p4PalCount: buffer.readInt32LE(20),
    p8PalCount: buffer.readInt32LE(24),
    reserved: buffer.readInt32LE(28)
  };
}

/**
 * Parse texture entry (version 3 format)
 */
function parseEntryV3(buffer, offset) {
  return {
    dataOffset: buffer.readInt32LE(offset),
    dataSize: buffer.readInt32LE(offset + 4),
    paletteIndex: buffer.readInt32LE(offset + 8),
    flags: buffer.readUInt32LE(offset + 12),
    type: buffer.readUInt32LE(offset + 16),
    format: buffer.readUInt32LE(offset + 20),
    width: buffer.readUInt16LE(offset + 24),
    height: buffer.readUInt16LE(offset + 26),
    mipCount: buffer.readUInt8(offset + 28)
  };
}

/**
 * Vita Morton order unswizzle
 *
 * The Vita uses a Morton/Z-order curve for texture storage.
 * This interleaves bits of X and Y coordinates.
 */
function vitaUnswizzle(width, height, isBlockEncoding = false) {
  // Build the bit field for coordinate transformation
  const bitField = [];
  const bitStart = isBlockEncoding ? 4 : 1;

  if (isBlockEncoding) {
    bitField.push([1, 0], [2, 0], [0, 1], [0, 2]);
  }

  const minDim = Math.min(width, height);
  for (let i = bitStart; i < minDim; i *= 2) {
    bitField.push([0, i], [i, 0]);
  }

  // Calculate macro tile dimensions (note: +1 like in MasterSwizzle.cs)
  let macroTileWidth = 0;
  let macroTileHeight = 0;
  for (const [x, y] of bitField) {
    macroTileWidth |= x;
    macroTileHeight |= y;
  }
  macroTileWidth += 1;
  macroTileHeight += 1;

  const widthInTiles = Math.ceil(width / macroTileWidth);
  const pointsInMacroBlock = macroTileWidth * macroTileHeight;

  // Create transformation function
  return function transform(pointCount) {
    const macroTileCount = Math.floor(pointCount / pointsInMacroBlock);
    const macroX = macroTileCount % widthInTiles;
    const macroY = Math.floor(macroTileCount / widthInTiles);

    let x = macroX * macroTileWidth;
    let y = macroY * macroTileHeight;

    // Apply bit field transformations
    for (let i = 0; i < bitField.length; i++) {
      const bit = (pointCount >> i) & 1;
      x ^= bit * bitField[i][0];
      y ^= bit * bitField[i][1];
    }

    return { x, y };
  };
}

// Palette format codes (from GxtSupport.cs)
const PALETTE_ABGR = 0x0000;
const PALETTE_ARGB = 0x1000;
const PALETTE_RGBA = 0x2000;
const PALETTE_BGRA = 0x3000;
const PALETTE_XBGR = 0x4000;
const PALETTE_XRGB = 0x5000;
const PALETTE_RGBX = 0x6000;
const PALETTE_BGRX = 0x7000;

/**
 * Read palette data from GXT
 */
function readPalette(buffer, header, paletteIndex, is4bit, paletteFormat) {
  const paletteSize = is4bit ? 16 * 4 : 256 * 4;
  const p8Offset = header.dataOffset + header.dataSize - header.p8PalCount * 256 * 4;
  const p4Offset = p8Offset - header.p4PalCount * 16 * 4;

  let offset;
  if (is4bit) {
    offset = p4Offset + paletteIndex * 16 * 4;
  } else {
    offset = p8Offset + paletteIndex * 256 * 4;
  }

  const colors = [];
  const count = is4bit ? 16 : 256;

  for (let i = 0; i < count; i++) {
    const pos = offset + i * 4;
    const b0 = buffer.readUInt8(pos);
    const b1 = buffer.readUInt8(pos + 1);
    const b2 = buffer.readUInt8(pos + 2);
    const b3 = buffer.readUInt8(pos + 3);

    let r, g, b, a;

    switch (paletteFormat) {
      case PALETTE_ABGR:
        a = b0; b = b1; g = b2; r = b3;
        break;
      case PALETTE_ARGB:
        a = b0; r = b1; g = b2; b = b3;
        break;
      case PALETTE_RGBA:
        r = b0; g = b1; b = b2; a = b3;
        break;
      case PALETTE_BGRA:
        b = b0; g = b1; r = b2; a = b3;
        break;
      case PALETTE_XBGR:
        a = 255; b = b1; g = b2; r = b3;
        break;
      case PALETTE_XRGB:
        a = 255; r = b1; g = b2; b = b3;
        break;
      case PALETTE_RGBX:
        r = b0; g = b1; b = b2; a = 255;
        break;
      case PALETTE_BGRX:
        b = b0; g = b1; r = b2; a = 255;
        break;
      default:
        // Default to RGBA
        r = b0; g = b1; b = b2; a = b3;
    }

    colors.push({ r, g, b, a });
  }

  return colors;
}

/**
 * Decode I8 (8-bit indexed) texture
 */
function decodeI8(buffer, entry, palette, header) {
  const width = entry.width;
  const height = entry.height;
  const pixelData = new Uint8Array(width * height * 4);

  // Read raw pixel indices
  const indices = buffer.slice(entry.dataOffset, entry.dataOffset + entry.dataSize);

  // Check if swizzled
  const isSwizzled = (entry.type & 0xFF000000) === TYPE_SWIZZLED;

  if (isSwizzled) {
    // Unswizzle using Vita Morton order
    const unswizzle = vitaUnswizzle(width, height, false);

    for (let i = 0; i < width * height; i++) {
      const { x, y } = unswizzle(i);
      if (x < width && y < height) {
        const colorIndex = indices[i];
        const color = palette[colorIndex] || { r: 255, g: 0, b: 255, a: 255 };
        const destIndex = (y * width + x) * 4;
        pixelData[destIndex] = color.r;
        pixelData[destIndex + 1] = color.g;
        pixelData[destIndex + 2] = color.b;
        pixelData[destIndex + 3] = color.a;
      }
    }
  } else {
    // Linear layout
    for (let i = 0; i < width * height; i++) {
      const colorIndex = indices[i];
      const color = palette[colorIndex] || { r: 255, g: 0, b: 255, a: 255 };
      const destIndex = i * 4;
      pixelData[destIndex] = color.r;
      pixelData[destIndex + 1] = color.g;
      pixelData[destIndex + 2] = color.b;
      pixelData[destIndex + 3] = color.a;
    }
  }

  return { width, height, data: pixelData };
}

/**
 * Decode I4 (4-bit indexed) texture
 */
function decodeI4(buffer, entry, palette, header) {
  const width = entry.width;
  const height = entry.height;
  const pixelData = new Uint8Array(width * height * 4);

  const rawData = buffer.slice(entry.dataOffset, entry.dataOffset + entry.dataSize);
  const isSwizzled = (entry.type & 0xFF000000) === TYPE_SWIZZLED;

  if (isSwizzled) {
    const unswizzle = vitaUnswizzle(width, height, false);

    for (let i = 0; i < width * height; i++) {
      const { x, y } = unswizzle(i);
      if (x < width && y < height) {
        const byteIndex = Math.floor(i / 2);
        const colorIndex = (i % 2 === 0) ? (rawData[byteIndex] & 0x0F) : (rawData[byteIndex] >> 4);
        const color = palette[colorIndex] || { r: 255, g: 0, b: 255, a: 255 };
        const destIndex = (y * width + x) * 4;
        pixelData[destIndex] = color.r;
        pixelData[destIndex + 1] = color.g;
        pixelData[destIndex + 2] = color.b;
        pixelData[destIndex + 3] = color.a;
      }
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      const byteIndex = Math.floor(i / 2);
      const colorIndex = (i % 2 === 0) ? (rawData[byteIndex] & 0x0F) : (rawData[byteIndex] >> 4);
      const color = palette[colorIndex] || { r: 255, g: 0, b: 255, a: 255 };
      const destIndex = i * 4;
      pixelData[destIndex] = color.r;
      pixelData[destIndex + 1] = color.g;
      pixelData[destIndex + 2] = color.b;
      pixelData[destIndex + 3] = color.a;
    }
  }

  return { width, height, data: pixelData };
}

/**
 * Save pixel data as PNG using sharp
 */
async function savePNG(pixelData, width, height, outputPath) {
  await sharp(Buffer.from(pixelData), {
    raw: {
      width,
      height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
}

/**
 * Convert GXT file to PNG(s)
 * @param {string} inputPath - Path to GXT file
 * @param {string} outputDir - Output directory for PNG files
 * @param {boolean} silent - Suppress console output
 */
export async function convertGXT(inputPath, outputDir, silent = false) {
  const log = silent ? () => {} : console.log.bind(console);
  const warn = silent ? () => {} : console.warn.bind(console);

  const buffer = await readFile(inputPath);

  // Parse header
  const header = parseHeader(buffer);
  log(`GXT version: 0x${header.version.toString(16)}`);
  log(`Texture count: ${header.texCount}`);
  log(`Data offset: 0x${header.dataOffset.toString(16)}`);
  log(`Data size: ${header.dataSize}`);
  log(`P4 palettes: ${header.p4PalCount}, P8 palettes: ${header.p8PalCount}`);

  if (header.version !== 0x10000003) {
    warn(`Warning: Only GXT version 3 is fully supported. Found version 0x${header.version.toString(16)}`);
  }

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  const results = [];
  const baseName = basename(inputPath, '.gxt');

  // Parse and decode each texture
  for (let i = 0; i < header.texCount; i++) {
    const entryOffset = HEADER_SIZE + i * ENTRY_SIZE_V3;
    const entry = parseEntryV3(buffer, entryOffset);

    log(`\nTexture ${i}:`);
    log(`  Size: ${entry.width}x${entry.height}`);
    log(`  Format: 0x${entry.format.toString(16)}`);
    log(`  Type: 0x${entry.type.toString(16)}`);
    log(`  Palette index: ${entry.paletteIndex}`);
    log(`  Data offset: 0x${entry.dataOffset.toString(16)}`);
    log(`  Data size: ${entry.dataSize}`);

    const formatBase = ((entry.format >>> 24) << 24) >>> 0;  // Get top byte as unsigned
    let decoded;

    if (formatBase === FORMAT_I8) {
      const paletteFormat = entry.format & 0xFFFF;
      const palette = readPalette(buffer, header, entry.paletteIndex, false, paletteFormat);
      decoded = decodeI8(buffer, entry, palette, header);
    } else if (formatBase === FORMAT_I4) {
      const paletteFormat = entry.format & 0xFFFF;
      const palette = readPalette(buffer, header, entry.paletteIndex, true, paletteFormat);
      decoded = decodeI4(buffer, entry, palette, header);
    } else if (formatBase === FORMAT_DXT1) {
      log(`  Skipping: DXT1 format not yet supported`);
      continue;
    } else {
      log(`  Skipping: Unknown format 0x${formatBase.toString(16)}`);
      continue;
    }

    const outputPath = join(outputDir, `${baseName}_${i}.png`);
    await savePNG(decoded.data, decoded.width, decoded.height, outputPath);
    log(`  Saved: ${outputPath}`);
    results.push(outputPath);
  }

  return results;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(`Usage: gxt-to-png.js <input.gxt> [output-dir]

Converts GXT texture files to PNG images.

Arguments:
  input.gxt    Path to GXT file (decompressed)
  output-dir   Output directory (default: same as input)

Supported formats:
  - I8 (8-bit indexed) with Vita swizzle
  - I4 (4-bit indexed) with Vita swizzle

Example:
  node gxt-to-png.js texture.gxt ./output/`);
    process.exit(1);
  }

  const inputPath = args[0];
  const outputDir = args[1] || dirname(inputPath);

  try {
    const results = await convertGXT(inputPath, outputDir);
    console.log(`\nConverted ${results.length} texture(s)`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
