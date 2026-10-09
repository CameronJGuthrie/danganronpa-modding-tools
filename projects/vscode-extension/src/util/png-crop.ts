import * as zlib from "node:zlib";

/**
 * Crop rows out of a PNG without an image library: the hover shows a sprite's head beside its
 * full bust-up, and VS Code strips any CSS that could crop in place. Handles the files
 * `pnpm run reset --convert image` writes (8-bit, non-interlaced, any colour type); anything
 * else throws. Rows are unfiltered, the chosen ones kept, and written back with filter 0.
 */

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS: Readonly<Record<number, number>> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export interface PngHeader {
  width: number;
  height: number;
  bitDepth: number;
  colourType: number;
  interlace: number;
}

export function readPngHeader(png: Buffer): PngHeader {
  if (!png.subarray(0, 8).equals(SIGNATURE) || png.toString("latin1", 12, 16) !== "IHDR") {
    throw new Error("not a PNG");
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    bitDepth: png[24],
    colourType: png[25],
    interlace: png[28],
  };
}

/** The PNG with only its top `height` rows (or the whole image when it is already that short). */
export function cropPngTop(png: Buffer, height: number): Buffer {
  return cropPngRows(png, 0, height);
}

/**
 * The PNG cropped to `height` rows starting at the first row with a visible pixel, which on a
 * bust-up texture is the top of the head. An image without an alpha channel starts at row 0.
 */
export function cropPngFromFirstVisibleRow(png: Buffer, height: number): Buffer {
  const { header, rows } = decodeRows(png);
  const alpha = header.colourType === 6 ? 3 : header.colourType === 4 ? 1 : undefined;
  const bpp = CHANNELS[header.colourType];
  let start = 0;
  if (alpha !== undefined) {
    start = rows.findIndex((row) => {
      for (let x = alpha; x < row.length; x += bpp) {
        if (row[x] !== 0) {
          return true;
        }
      }
      return false;
    });
    if (start === -1) {
      start = 0;
    }
  }
  return cropPngRows(png, start, height);
}

/** The PNG with `height` rows from row `start` (clipped to the image). */
export function cropPngRows(png: Buffer, start: number, height: number): Buffer {
  const { header, rows, chunks } = decodeRows(png);
  const first = Math.min(Math.max(start, 0), header.height);
  const kept = rows.slice(first, first + height);
  const stride = header.width * CHANNELS[header.colourType];
  const out = Buffer.alloc(kept.length * (stride + 1));
  kept.forEach((row, y) => {
    out[y * (stride + 1)] = 0;
    row.copy(out, y * (stride + 1) + 1);
  });

  const ihdr = Buffer.from(png.subarray(16, 29));
  ihdr.writeUInt32BE(kept.length, 4);
  // Keep the chunks the pixels depend on (palette, transparency, gamma); drop the old image data
  const ancillary = chunks.filter((c) => ["PLTE", "tRNS", "gAMA", "sRGB", "iCCP"].includes(c.type));
  return Buffer.concat([
    SIGNATURE,
    chunk("IHDR", ihdr),
    ...ancillary.map((c) => chunk(c.type, c.data)),
    chunk("IDAT", zlib.deflateSync(out)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Every row of the image unfiltered, plus the header and chunk list. */
function decodeRows(png: Buffer): { header: PngHeader; rows: Buffer[]; chunks: { type: string; data: Buffer }[] } {
  const header = readPngHeader(png);
  if (header.bitDepth !== 8 || header.interlace !== 0 || !(header.colourType in CHANNELS)) {
    throw new Error("unsupported PNG: only 8-bit non-interlaced images can be cropped");
  }
  const bpp = CHANNELS[header.colourType];
  const stride = header.width * bpp;

  const chunks: { type: string; data: Buffer }[] = [];
  for (let offset = 8; offset < png.length; ) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("latin1", offset + 4, offset + 8);
    chunks.push({ type, data: png.subarray(offset + 8, offset + 8 + length) });
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks.filter((c) => c.type === "IDAT").map((c) => c.data)));

  const rows: Buffer[] = [];
  let previous = Buffer.alloc(stride);
  for (let y = 0; y < header.height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const current = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? current[x - bpp] : 0;
      const b = previous[x];
      const c = x >= bpp ? previous[x - bpp] : 0;
      let predictor: number;
      switch (filter) {
        case 0:
          predictor = 0;
          break;
        case 1:
          predictor = a;
          break;
        case 2:
          predictor = b;
          break;
        case 3:
          predictor = (a + b) >> 1;
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          break;
        }
        default:
          throw new Error(`unknown PNG filter ${filter}`);
      }
      current[x] = (line[x] + predictor) & 0xff;
    }
    rows.push(current);
    previous = current;
  }
  return { header, rows, chunks };
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(typed));
  return Buffer.concat([length, typed, crc]);
}
