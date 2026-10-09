/**
 * Layout of `workbench/mods/<name>/<wad>/Dr1/data/us/script` (and of `workbench/exploration`, see
 * `explorationScriptPath` and `explorationWadDir`).
 *
 * The game wants one flat directory of `eCC_SSS_NNN.lin` files, but authored `.linscript`
 * files may be organised by chapter and scene:
 *
 *   chapter_00/scene_001/000.linscript              ->  e00_001_000
 *   chapter_01/scene_005/103_MakotosRoom.linscript  ->  e01_005_103
 *   e00_001_000.linscript                           ->  e00_001_000
 *   chapter_00/e00_001_000_Intro.linscript          ->  e00_001_000
 *   chapter_08_despair/scene_007_sayaka/001.linscript -> e08_007_001
 *
 * Only the leading numbers matter: anything after them (separated by a non-digit) is a label
 * for the author, on the chapter and scene directories as much as on the file. A file whose
 * basename starts with a flat script name keeps it wherever it lives; any other file must sit
 * at `chapter_CC<label>/scene_SSS<label>/NNN<label>.linscript`. New files are always created flat, so a labelled
 * directory is only ever reused, never invented.
 *
 * A directory named `pak_<name>` anywhere under the mod WAD (`pakDirectories`) holds
 * replacement entries for the archive `<name>.pak` at the same place in the WAD:
 *
 *   Dr1/data/us/script/pak_script_pak_e00/0002.linscript        ->  entry 2 of script_pak_e00.pak
 *   Dr1/data/us/script/pak_script_pak_e00/0002_NewGame.linscript ->  entry 2 of script_pak_e00.pak
 *
 * The leading digits of each file name its entry index and the rest is a label, as above. A
 * `.linscript` entry is compiled and any other file is packed as it is. The build rewrites the
 * archive with only those entries replaced, so its other entries and its entry count are kept.
 * `pak_` directories are not part of the flat script layout and `collectModScripts` skips them.
 */

import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";

export const SCRIPT_DIR_SEGMENTS = ["Dr1", "data", "us", "script"] as const;

/** Directories whose contents replace entries of a `.pak` rather than being scripts. */
export const PAK_DIR_PREFIX = "pak_";

const FLAT_NAME = /^(e\d{2}_\d{3}_\d{3})(?:[^\d].*)?$/;
const NESTED_PATH = /^chapter_(\d{2})(?:[^\d/][^/]*)?\/scene_(\d{3})(?:[^\d/][^/]*)?\/(\d{3})(?:[^\d].*)?$/;

/** Flat script name (no extension) for a `.linscript` at `relativePath` inside the script dir, or null if the path fits neither layout. */
export function flatScriptName(relativePath: string): string | null {
  const posix = relativePath.split(sep).join("/");
  if (!posix.endsWith(".linscript")) {
    return null;
  }
  const stem = posix.slice(0, -".linscript".length);
  const flat = FLAT_NAME.exec(basename(stem));
  if (flat !== null) {
    return flat[1];
  }
  const match = NESTED_PATH.exec(stem);
  return match ? `e${match[1]}_${match[2]}_${match[3]}` : null;
}

/**
 * Where `pnpm run reset` writes the read-only decompiled copy of `flatName` inside
 * `workbench/exploration`: `chapter_CC/scene_SSS/eCC_SSS_NNN.linscript`. The basename keeps the
 * full game name so the file flattens under the rule above and tools can match it by basename.
 */
export function explorationScriptPath(flatName: string): string {
  const match = /^e(\d{2})_(\d{3})_(\d{3})$/.exec(flatName);
  if (match === null) {
    throw new Error(`Not a script name: ${flatName}`);
  }
  return join(`chapter_${match[1]}`, `scene_${match[2]}`, `${flatName}.linscript`);
}

/**
 * The directory inside `workbench/exploration` where `pnpm run reset` extracts a WAD:
 * `wad_dr1_data_us` for `dr1_data_us.wad` (or for the bare name `dr1_data_us`).
 */
export function explorationWadDir(wadName: string): string {
  return `wad_${wadName.replace(/\.wad$/, "")}`;
}

export interface ModScript {
  /** Flat name without extension, e.g. `e00_001_000`. */
  name: string;
  /** Absolute path of the authored `.linscript`. */
  path: string;
}

/**
 * Every `.linscript` under `scriptDir`, keyed by flat name. Throws when a file fits neither
 * layout or two files flatten to the same name, since the build could not tell which to ship.
 */
export async function collectModScripts(scriptDir: string): Promise<Map<string, ModScript>> {
  const scripts = new Map<string, ModScript>();
  const problems: string[] = [];

  for (const path of await walkLinscripts(scriptDir)) {
    const relativePath = relative(scriptDir, path);
    const name = flatScriptName(relativePath);
    if (name === null) {
      problems.push(`${relativePath}: expected chapter_CC/scene_SSS/NNN*.linscript or eCC_SSS_NNN*.linscript`);
      continue;
    }
    const existing = scripts.get(name);
    if (existing !== undefined) {
      problems.push(`${relativePath} and ${relative(scriptDir, existing.path)} both flatten to ${name}`);
      continue;
    }
    scripts.set(name, { name, path });
  }

  if (problems.length > 0) {
    throw new Error(`Cannot organise mod scripts:\n  ${problems.join("\n  ")}`);
  }
  return scripts;
}

/** The authored file for `flatName` under `scriptDir`, if one exists in either layout. */
export async function findModScript(scriptDir: string, flatName: string): Promise<string | null> {
  const scripts = await collectModScripts(scriptDir);
  return scripts.get(flatName)?.path ?? null;
}

/**
 * Absolute paths of every `.linscript` under `directory`, recursively; empty when it does not
 * exist. `pak_` directories are not descended into: their files are archive entries, not scripts.
 */
export async function walkLinscripts(directory: string): Promise<string[]> {
  const files: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!isPakDirectory(entry.name)) {
        files.push(...(await walkLinscripts(path)));
      }
    } else if (entry.isFile() && entry.name.endsWith(".linscript")) {
      files.push(path);
    }
  }
  return files;
}

/** True for a directory name of the form `pak_<name>`, with a non-empty name. */
export function isPakDirectory(directoryName: string): boolean {
  return directoryName.length > PAK_DIR_PREFIX.length && directoryName.startsWith(PAK_DIR_PREFIX);
}

/** The archive a `pak_<name>` directory replaces entries of: `<name>.pak`. */
export function pakFileName(directoryName: string): string {
  if (!isPakDirectory(directoryName)) {
    throw new Error(`Not a pak directory: ${directoryName}`);
  }
  return `${directoryName.slice(PAK_DIR_PREFIX.length)}.pak`;
}

/**
 * Entry index named by a file inside a `pak_` directory: its leading digits (`0002.linscript`,
 * `0002_NewGame.linscript`, `3.tga`), or null when the name does not start with a digit.
 */
export function pakEntryIndex(fileName: string): number | null {
  const match = /^(\d+)(?:[^\d].*)?$/.exec(fileName);
  return match ? Number.parseInt(match[1], 10) : null;
}

export interface ModPakEntry {
  /** Index of the entry inside the archive. */
  index: number;
  /** Absolute path of the authored file. */
  path: string;
  /** `.linscript` entries are compiled before packing; anything else is packed as it is. */
  compile: boolean;
}

export interface ModPak {
  /** Path of the `.pak` relative to the mod WAD directory, e.g. `Dr1/data/us/script/script_pak_e00.pak`. */
  relativePakPath: string;
  /** Absolute path of the `pak_<name>` directory. */
  path: string;
  /** Replacement entries, keyed by index. */
  entries: Map<number, ModPakEntry>;
}

/**
 * Every `pak_<name>` directory under `wadDir` (a `workbench/mods/<name>/<wad>` directory) with its
 * entries. Throws when a file's name does not start with an entry index or two files name the
 * same entry, since the build could not tell which to pack. Dot-directories are not searched.
 */
export async function collectModPaks(wadDir: string): Promise<ModPak[]> {
  const paks: ModPak[] = [];
  const problems: string[] = [];

  for (const pakDir of await pakDirectories(wadDir)) {
    const entries = new Map<number, ModPakEntry>();
    const dirents = (await readdir(pakDir, { withFileTypes: true })).filter((entry) => entry.isFile());
    for (const dirent of dirents.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(pakDir, dirent.name);
      const relativePath = relative(wadDir, path);
      const index = pakEntryIndex(dirent.name);
      if (index === null) {
        problems.push(`${relativePath}: expected the file name to start with its entry index, e.g. 0002.linscript`);
        continue;
      }
      const existing = entries.get(index);
      if (existing !== undefined) {
        problems.push(`${relativePath} and ${relative(wadDir, existing.path)} both name entry ${index}`);
        continue;
      }
      entries.set(index, { index, path, compile: dirent.name.endsWith(".linscript") });
    }
    const relativePakPath = join(relative(wadDir, dirname(pakDir)), pakFileName(basename(pakDir)));
    paks.push({ relativePakPath, path: pakDir, entries });
  }

  if (problems.length > 0) {
    throw new Error(`Cannot organise mod pak entries:\n  ${problems.join("\n  ")}`);
  }
  return paks.sort((a, b) => a.relativePakPath.localeCompare(b.relativePakPath));
}

/** Absolute paths of every `pak_<name>` directory under `directory`, recursively, skipping dot-directories. */
async function pakDirectories(directory: string): Promise<string[]> {
  const found: string[] = [];
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    const path = join(directory, entry.name);
    if (isPakDirectory(entry.name)) {
      found.push(path);
    } else {
      found.push(...(await pakDirectories(path)));
    }
  }
  return found;
}
