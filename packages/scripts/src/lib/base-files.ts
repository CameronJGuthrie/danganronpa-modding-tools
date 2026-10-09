/**
 * The backup of the game's WAD archives under `workbench/base_files/`,
 * one plain `.wad` per archive, copied straight from the game directory.
 */

import { copyFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
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

/** Where the backup of `wadFile` lives. */
export function baseFilePath(wadFile: WadFile): string {
  return join(BASE_FILES_DIR, wadFile);
}

/** Copy `sourcePath` into the backup of `wadFile`. */
export async function backupWad(sourcePath: string, wadFile: WadFile): Promise<void> {
  await mkdir(BASE_FILES_DIR, { recursive: true });
  await copyFile(sourcePath, baseFilePath(wadFile));
}

/** The path of the backup of `wadFile`, or an error telling the user to run setup if it is missing. */
export async function requireBaseFile(wadFile: WadFile): Promise<string> {
  const path = baseFilePath(wadFile);
  try {
    await stat(path);
  } catch {
    throw new Error(`${wadFile} backup not found at ${path}; run "pnpm run setup" first`);
  }
  return path;
}
