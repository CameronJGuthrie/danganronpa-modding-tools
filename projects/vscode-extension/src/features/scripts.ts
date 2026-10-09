import { chmod, copyFile, mkdir, readdir } from "node:fs/promises";
import * as path from "node:path";
import {
  findModScript,
  PAK_DIR_PREFIX,
  pakEntryIndex,
  SCRIPT_DIR_SEGMENTS,
} from "danganronpa-scripts/src/lib/mod-scripts.ts";
import type { CompilerClient } from "./compiler";

/**
 * The mod this extension edits: mods are directories under `<workbench>/mod/`, and the extension
 * authors into `default`, under `<workbench>/mod/default/<wad>/Dr1/data/us/script`.
 */
const MOD_NAME = "default";
const MOD_WAD = "dr1_data_us";

/** The directory at the top of every WAD's contents, e.g. `<wad>/Dr1/data/us/script`. */
const WAD_CONTENT_ROOT = "Dr1";

/** The authored script directory, `<workbench>/mod/default/dr1_data_us/Dr1/data/us/script`. */
export function modScriptDir(workbenchRoot: string): string {
  return path.join(workbenchRoot, "mod", MOD_NAME, MOD_WAD, ...SCRIPT_DIR_SEGMENTS);
}

/**
 * "Select for Modding": make a writable `.linscript` for `file` in the mod script directory and
 * return its path. A `.lin` is decompiled there (off-thread, through the compiler worker); a
 * `.linscript` is copied. When an authored file for the same script already exists (flat or
 * organised by chapter/scene), nothing is written and that file's path is returned, so selecting
 * again opens the edited script instead of overwriting it.
 */
export async function selectScript(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const flatName = path.basename(file, path.extname(file));
  if (/^\d/.test(flatName)) {
    // `0002.linscript` inside an extracted pak folder is an archive entry, not a flat script
    return selectPakEntry(compiler, workbenchRoot, file);
  }

  const scriptDir = modScriptDir(workbenchRoot);
  const existing = await findModScript(scriptDir, flatName);
  if (existing !== null) {
    return existing;
  }

  const output = path.join(scriptDir, `${flatName}.linscript`);
  await mkdir(path.dirname(output), { recursive: true });

  if (path.extname(file) === ".lin") {
    await compiler.decompileFile(file, output);
  } else {
    await copyFile(file, output);
    await chmod(output, 0o644); // exploration files are read-only
  }
  return output;
}

/**
 * Where an extracted pak folder (`…/Dr1/data/us/script/script_pak_e00`, holding `0000.lin` or
 * `0000.linscript` entries) is authored in the mod: the same place under `Dr1`, named
 * `pak_<folder>`, so the build knows which archive the entries replace. Throws when the folder is
 * not inside a `Dr1` directory, since its place in the WAD is then unknown.
 */
export function modPakDir(workbenchRoot: string, pakFolder: string): string {
  const segments = pakFolder.split(path.sep);
  const rootIndex = segments.lastIndexOf(WAD_CONTENT_ROOT);
  if (rootIndex === -1) {
    throw new Error(`${pakFolder} is not inside a ${WAD_CONTENT_ROOT} directory, so its place in the WAD is unknown`);
  }
  const inside = segments.slice(rootIndex, -1);
  return path.join(workbenchRoot, "mod", MOD_NAME, MOD_WAD, ...inside, `${PAK_DIR_PREFIX}${path.basename(pakFolder)}`);
}

export interface PakEntryFile {
  index: number;
  /** Absolute path; the `.linscript` when both it and the `.lin` exist. */
  file: string;
}

/**
 * The entries of an extracted pak folder in index order: every file named by its index, whatever
 * its type (`.lin` scripts, `.txt` text tables, textures...). When an index has both a `.lin` and
 * a `.linscript`, the `.linscript` is listed. Nested pak directories are skipped.
 */
export async function listPakEntries(pakFolder: string): Promise<PakEntryFile[]> {
  const byIndex = new Map<number, string>();
  const entries = (await readdir(pakFolder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const index = pakEntryIndex(entry.name);
    if (index === null || entry.isDirectory()) {
      continue;
    }
    const current = byIndex.get(index);
    if (current === undefined || path.extname(entry.name) === ".linscript") {
      byIndex.set(index, path.join(pakFolder, entry.name));
    }
  }
  return [...byIndex.entries()].sort(([a], [b]) => a - b).map(([index, file]) => ({ index, file }));
}

/** The authored file for entry `index` in `modPakFolder`, if any (any extension, any label). */
async function findModPakEntry(modPakFolder: string, index: number): Promise<string | null> {
  let names: string[];
  try {
    names = await readdir(modPakFolder);
  } catch {
    return null;
  }
  const match = names.find((name) => pakEntryIndex(name) === index);
  return match === undefined ? null : path.join(modPakFolder, match);
}

/**
 * Make a writable copy of one entry of an extracted pak folder in the mod's `pak_` directory (see
 * `modPakDir`) and return its path: a `.lin` is decompiled to a `.linscript`, a `.linscript` or
 * any other file is copied under its own name, since the build packs non-script entries as they
 * are. An existing authored file for the same index is returned untouched.
 */
export async function selectPakEntry(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const index = pakEntryIndex(path.basename(file));
  if (index === null) {
    throw new Error(`${path.basename(file)} does not start with a pak entry index`);
  }
  const targetDir = modPakDir(workbenchRoot, path.dirname(file));
  const existing = await findModPakEntry(targetDir, index);
  if (existing !== null) {
    return existing;
  }

  await mkdir(targetDir, { recursive: true });
  if (path.extname(file) === ".lin") {
    const output = path.join(targetDir, `${path.basename(file, ".lin")}.linscript`);
    await compiler.decompileFile(file, output);
    return output;
  }
  const output = path.join(targetDir, path.basename(file));
  await copyFile(file, output);
  await chmod(output, 0o644); // exploration files are read-only
  return output;
}

/** "Verify File": decompile `file` into `<workbench>/verify/` and return the `.linscript` path. */
export async function verifyScript(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const verifyDir = path.join(workbenchRoot, "verify");
  const output = path.join(verifyDir, `${path.basename(file, ".lin")}.linscript`);
  await mkdir(verifyDir, { recursive: true });
  await compiler.decompileFile(file, output);
  return output;
}
