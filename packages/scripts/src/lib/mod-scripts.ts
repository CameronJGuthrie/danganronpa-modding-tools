/**
 * Layout of `workbench/mod/<wad>/Dr1/data/us/script` (and of `workbench/exploration`, see
 * `explorationScriptPath`).
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
 */

import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, join, relative, sep } from "node:path";

export const SCRIPT_DIR_SEGMENTS = ["Dr1", "data", "us", "script"] as const;

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

/** Absolute paths of every `.linscript` under `directory`, recursively; empty when it does not exist. */
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
      files.push(...(await walkLinscripts(path)));
    } else if (entry.isFile() && entry.name.endsWith(".linscript")) {
      files.push(path);
    }
  }
  return files;
}
