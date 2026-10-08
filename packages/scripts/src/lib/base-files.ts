/**
 * The backup of the game's WAD archives under `workbench/base_files/`.
 *
 * Each WAD is stored as its own zstd frame (`dr1_data_us.wad.zst`), compressed
 * with Node's built-in zstd at level 3 across all cores. The game data is already
 * mostly compressed, so higher levels gain under 3% for many times the CPU time,
 * and one file per WAD lets a reader decompress only the archive it needs.
 *
 * Compression uses `zstdCompressSync` deliberately: with `ZSTD_c_nbWorkers` set,
 * the streaming wrapper fails with ERR_STREAM_PUSH_AFTER_EOF and the callback
 * form returns an empty buffer for inputs above a few megabytes (Node 26.10).
 * Only the sync call produces correct multi-threaded output. It blocks the event
 * loop, which is fine for a command-line script.
 */

import { availableParallelism } from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { constants as zlibConstants, zstdCompressSync, zstdDecompress } from "node:zlib";
import { WORKBENCH_DIR } from "./paths.ts";

export const BASE_FILES_DIR = join(WORKBENCH_DIR, "base_files");

/** The WAD archives the backup holds. */
export const WAD_FILES = [
  "dr1_data.wad",
  "dr1_data_us.wad",
  "dr1_data_keyboard_us.wad",
  "dr1_data_keyboard.wad",
] as const;

export type WadFile = (typeof WAD_FILES)[number];

const COMPRESSION_LEVEL = 3;

const decompressAsync = promisify(zstdDecompress);

/** Where the backup of `wadFile` lives. */
export function baseFilePath(wadFile: WadFile): string {
  return join(BASE_FILES_DIR, `${wadFile}.zst`);
}

/** Compress `sourcePath` into the backup of `wadFile`. Returns the compressed size in bytes. */
export async function backupWad(sourcePath: string, wadFile: WadFile): Promise<number> {
  const compressed = zstdCompressSync(await readFile(sourcePath), {
    params: {
      [zlibConstants.ZSTD_c_compressionLevel]: COMPRESSION_LEVEL,
      [zlibConstants.ZSTD_c_nbWorkers]: availableParallelism(),
      [zlibConstants.ZSTD_c_checksumFlag]: 1,
    },
  });
  await mkdir(BASE_FILES_DIR, { recursive: true });
  await writeFile(baseFilePath(wadFile), compressed);
  return compressed.length;
}

/** Decompress the backup of `wadFile` to `destinationPath`. */
export async function restoreWad(wadFile: WadFile, destinationPath: string): Promise<void> {
  const path = baseFilePath(wadFile);
  let compressed: Buffer;
  try {
    compressed = await readFile(path);
  } catch {
    throw new Error(`${wadFile} backup not found at ${path}; run "pnpm run setup" first`);
  }
  await writeFile(destinationPath, await decompressAsync(compressed));
}
