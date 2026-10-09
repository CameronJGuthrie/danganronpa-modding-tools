#!/usr/bin/env node

/**
 * IVF to MP4 Converter
 *
 * The game's movies are VP8 streams in IVF containers, which MP4 cannot hold, so each is
 * re-encoded to H.264 with the system `ffmpeg` (libx264, which every player and the Electron GUI
 * can play; x265 would halve the size but triple the encode time and play in fewer places). The
 * extraction scripts (`lib/extract-tree.ts`) run this over every `.ivf` of an extracted WAD,
 * replacing `name.ivf` with `name.ivf.mp4`, and skip the step when `ffmpeg` is not installed.
 */

import { spawn } from "node:child_process";
import { open } from "node:fs/promises";
import { errorCode, errorMessage } from "../lib/errors.ts";

const IVF_MAGIC = "DKIF";

/** Output path for an `.ivf`: the same name with `.mp4` appended, so `movie_13.ivf` -> `movie_13.ivf.mp4`. */
export function mp4PathFor(ivfPath: string): string {
  return `${ivfPath}.mp4`;
}

/** The frame count in the IVF header (bytes 24-27); throws if the file is not an IVF. */
export async function readIvfFrameCount(ivfPath: string): Promise<number> {
  const file = await open(ivfPath);
  try {
    const header = Buffer.alloc(32);
    const { bytesRead } = await file.read(header, 0, 32, 0);
    if (bytesRead < 32 || header.toString("ascii", 0, 4) !== IVF_MAGIC) {
      throw new Error(`${ivfPath} is not an IVF file`);
    }
    return header.readUInt32LE(24);
  } finally {
    await file.close();
  }
}

/** Thrown by `convertIvfToMp4` when `ffmpeg` cannot be started. */
export class FfmpegMissingError extends Error {
  constructor() {
    super("ffmpeg is not installed or not on PATH");
    this.name = "FfmpegMissingError";
  }
}

/**
 * Re-encode `ivfPath` to an H.264 MP4 at `mp4Path`. `onFrame` is called with the number of frames
 * encoded so far as ffmpeg reports progress.
 */
export function convertIvfToMp4(
  ivfPath: string,
  mp4Path = mp4PathFor(ivfPath),
  onFrame?: (frames: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-nostdin",
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        ivfPath,
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "20",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-progress",
        "pipe:1",
        "-nostats",
        mp4Path,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let stderr = "";
    let pending = "";
    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      pending += chunk.toString();
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("frame=")) {
          onFrame?.(Number.parseInt(line.slice("frame=".length), 10));
        }
      }
    });
    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    ffmpeg.on("error", (error) => {
      reject(errorCode(error) === "ENOENT" ? new FfmpegMissingError() : error);
    });
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
      }
    });
  });
}

/** Whether `ffmpeg` can be started. */
export function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn("ffmpeg", ["-version"], { stdio: "ignore" });
    ffmpeg.on("error", () => resolve(false));
    ffmpeg.on("close", (code) => resolve(code === 0));
  });
}

// ============================================================================
// CLI
// ============================================================================

function showUsage(): void {
  console.log(`Usage: ivf-to-mp4.ts <file.ivf> [output.mp4]

Re-encodes one IVF movie to an H.264 MP4; the output defaults to <file.ivf>.mp4 next to the input.
Whole extracted WADs are converted by the setup scripts (pnpm run reset, extract-recursive).`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    return;
  }
  const [ivfPath, mp4Path = mp4PathFor(ivfPath)] = args;
  const total = await readIvfFrameCount(ivfPath);
  await convertIvfToMp4(ivfPath, mp4Path, (frames) => process.stdout.write(`\r${frames}/${total} frames`));
  console.log(`\nWrote ${mp4Path}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exit(1);
  });
}
