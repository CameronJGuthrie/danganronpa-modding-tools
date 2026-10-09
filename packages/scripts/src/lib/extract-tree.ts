/**
 * Turning an extracted WAD into something a person can browse: every `.pak` unpacked into a
 * folder of the same name (nested archives included), every `.lin` decompiled to a sibling
 * `.linscript`, every `.tga` converted to `.tga.png` and every `.ivf` movie re-encoded to
 * `.ivf.mp4`, the originals removed once converted.
 */

import { readdir, rm, unlink } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { basename, dirname, join } from "node:path";
import { Worker } from "node:worker_threads";
import { type BatchFailure, decompileDirectory } from "lin-compiler";
import { convertIvfToMp4, FfmpegMissingError, mp4PathFor, readIvfFrameCount } from "../formats/ivf-to-mp4.ts";
import { extractPak } from "../formats/pak-archiver.ts";
import { pngPathFor } from "../formats/tga-to-png.ts";
import type { TgaJob, TgaJobResult } from "../formats/tga-to-png.worker.ts";
import { errorMessage } from "./errors.ts";

async function walk(directory: string, visit: (path: string, name: string) => Promise<void>): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, visit);
    } else if (entry.isFile()) {
      await visit(fullPath, entry.name);
    }
  }
}

/**
 * Unpack every `.pak` under `directory` into a folder of the same name and remove the archive,
 * recursing into archives found inside archives. `onPak` is called with each top-level archive
 * before it is unpacked. Returns how many archives were unpacked.
 */
export async function extractPaksUnder(directory: string, onPak?: (pakPath: string) => void): Promise<number> {
  let count = 0;
  const paks: string[] = [];
  await walk(directory, async (path, name) => {
    if (name.endsWith(".pak")) {
      paks.push(path);
    }
  });
  for (const pakPath of paks) {
    onPak?.(pakPath);
    await extractPak(pakPath, pakPath.replace(/\.pak$/, ""), true, 0);
    count++;
  }
  // The pak extractor keeps nested archives next to their folders (and renames entries it
  // recognises as archives to `.pak`); remove every archive that has been unpacked
  await walk(directory, async (path, name) => {
    if (name.endsWith(".pak")) {
      const folder = path.replace(/\.pak$/, "");
      const entries = await readdir(folder).catch(() => null);
      if (entries !== null) {
        await unlink(path);
      }
    }
  });
  return count;
}

export interface DecompileTreeResult {
  /** Decompiled `.linscript` paths. */
  succeeded: string[];
  failed: BatchFailure[];
}

/**
 * Decompile every `.lin` under `directory` to a sibling `.linscript`, removing each `.lin` that
 * converted and keeping the ones that did not. `onFile` is called with each `.lin` before it is
 * converted.
 */
export async function decompileLinsUnder(
  directory: string,
  onFile?: (linPath: string) => void,
): Promise<DecompileTreeResult> {
  const directories = new Set<string>();
  await walk(directory, async (path, name) => {
    if (name.endsWith(".lin")) {
      directories.add(dirname(path));
    }
  });

  const result: DecompileTreeResult = { succeeded: [], failed: [] };
  for (const linDir of [...directories].sort()) {
    const batch = await decompileDirectory(linDir, {}, (fileName) => onFile?.(join(linDir, fileName)));
    for (const lin of batch.succeeded) {
      await rm(lin);
      result.succeeded.push(join(linDir, `${basename(lin, ".lin")}.linscript`));
    }
    result.failed.push(...batch.failed);
  }
  return result;
}

const TGA_WORKER = new URL("../formats/tga-to-png.worker.ts", import.meta.url);

export interface ConvertTexturesResult {
  /** Written `.tga.png` paths. */
  succeeded: string[];
  /** Files named `.tga` that are not TGA images (the pak extractor's type detection is loose). */
  skipped: string[];
  failed: { file: string; error: string }[];
}

/**
 * Convert every `.tga` under `directory` to `.tga.png`, removing each `.tga` that converted. The
 * work is spread over one worker thread per core (`formats/tga-to-png.worker.ts`). `onFile` is
 * called with each texture as it is handed to a worker. A file that is not a TGA image is skipped
 * and kept, and a texture that fails to convert is reported and kept, not thrown.
 */
export async function convertTgasUnder(
  directory: string,
  onFile?: (tgaPath: string) => void,
): Promise<ConvertTexturesResult> {
  const tgas: string[] = [];
  await walk(directory, async (path, name) => {
    if (name.toLowerCase().endsWith(".tga")) {
      tgas.push(path);
    }
  });
  tgas.sort();

  const result: ConvertTexturesResult = { succeeded: [], skipped: [], failed: [] };
  if (tgas.length === 0) {
    return result;
  }

  const workerCount = Math.min(availableParallelism(), tgas.length);
  const workers = Array.from({ length: workerCount }, () => new Worker(TGA_WORKER));
  let next = 0;

  /** Feed `worker` one texture at a time until the list is exhausted. */
  function drive(worker: Worker): Promise<void> {
    return new Promise((resolve, reject) => {
      const send = (): void => {
        if (next >= tgas.length) {
          resolve();
          return;
        }
        const id = next++;
        const tgaPath = tgas[id];
        onFile?.(tgaPath);
        const job: TgaJob = { id, tgaPath, pngPath: pngPathFor(tgaPath) };
        worker.postMessage(job);
      };
      worker.on("message", async (message: TgaJobResult) => {
        const tgaPath = tgas[message.id];
        if (message.ok) {
          await unlink(tgaPath);
          result.succeeded.push(pngPathFor(tgaPath));
        } else if (message.notTga) {
          result.skipped.push(tgaPath);
        } else {
          result.failed.push({ file: tgaPath, error: message.error });
        }
        send();
      });
      worker.on("error", reject);
      send();
    });
  }

  try {
    await Promise.all(workers.map(drive));
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
  result.succeeded.sort();
  result.skipped.sort();
  return result;
}

export interface ConvertMoviesResult {
  /** Written `.ivf.mp4` paths. */
  succeeded: string[];
  failed: { file: string; error: string }[];
  /** True when `ffmpeg` is not installed, in which case nothing was converted. */
  ffmpegMissing: boolean;
}

/**
 * Re-encode every `.ivf` under `directory` to `.ivf.mp4` with ffmpeg, removing each `.ivf` that
 * converted. The encoder uses every core itself, so the movies are converted one at a time.
 * `onFrames` is called with the number of frames encoded since the last call, for a bar counting
 * frames across the whole directory (see `countMovieFrames`). A movie that fails to convert is
 * reported and kept, not thrown; a missing `ffmpeg` stops the step and is reported in the result.
 */
export async function convertIvfsUnder(
  directory: string,
  onFrames?: (frames: number, ivfPath: string) => void,
): Promise<ConvertMoviesResult> {
  const result: ConvertMoviesResult = { succeeded: [], failed: [], ffmpegMissing: false };
  for (const ivfPath of await findMovies(directory)) {
    let reported = 0;
    try {
      const mp4Path = mp4PathFor(ivfPath);
      await convertIvfToMp4(ivfPath, mp4Path, (frames) => {
        onFrames?.(frames - reported, ivfPath);
        reported = frames;
      });
      await unlink(ivfPath);
      result.succeeded.push(mp4Path);
    } catch (error) {
      if (error instanceof FfmpegMissingError) {
        result.ffmpegMissing = true;
        break;
      }
      result.failed.push({ file: ivfPath, error: errorMessage(error) });
    }
  }
  return result;
}

/** The total frame count of every `.ivf` under `directory`, from their headers. */
export async function countMovieFrames(directory: string): Promise<number> {
  let frames = 0;
  for (const ivfPath of await findMovies(directory)) {
    frames += await readIvfFrameCount(ivfPath);
  }
  return frames;
}

async function findMovies(directory: string): Promise<string[]> {
  const movies: string[] = [];
  await walk(directory, async (path, name) => {
    if (name.endsWith(".ivf")) {
      movies.push(path);
    }
  });
  return movies.sort();
}
