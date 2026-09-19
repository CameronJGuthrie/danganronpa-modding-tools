import fs from "node:fs";
import path from "node:path";

/**
 * The folder of decompiled scripts the Script Browser opens by default: the repository's
 * `workbench/linscript-exploration`, found relative to the app (which lives in `projects/gui`).
 * Null when the workbench has not been generated (`pnpm run reset`).
 */
export function defaultScriptDirectory(appPath: string): string | null {
  const candidates = [
    path.resolve(appPath, "../../workbench/linscript-exploration"),
    path.resolve(appPath, "../../../workbench/linscript-exploration"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/** Every `.linscript` under `directory`, as forward-slash paths relative to it, sorted. */
export async function listLinscriptFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  await walk(directory, "", files);
  return files.sort();
}

async function walk(root: string, relative: string, files: string[]): Promise<void> {
  const entries = await fs.promises.readdir(path.join(root, relative), { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = relative === "" ? entry.name : `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      await walk(root, entryPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".linscript")) {
      files.push(entryPath);
    }
  }
}

/** Where `pnpm select` puts writable `.linscript` copies and `pnpm build` compiles them from. */
export function modScriptDirectory(appPath: string): string | null {
  const candidates = [
    path.resolve(appPath, "../../workbench/mod/dr1_data_us/Dr1/data/us/script"),
    path.resolve(appPath, "../../../workbench/mod/dr1_data_us/Dr1/data/us/script"),
  ];
  // The mod folder may not exist yet; pick the candidate whose workbench does
  return candidates.find((candidate) => fs.existsSync(path.resolve(candidate, "../../../../../.."))) ?? null;
}

export type SaveResult = {
  /** Absolute paths that now hold `source`. */
  written: string[];
  /** The opened file, when it was left untouched because it is read-only (e.g. a decompiled workbench file). */
  readOnly?: string;
};

/**
 * Save an edited script: write it back to the file it was opened from, and copy it into the mod
 * script directory under its own name so `pnpm build` picks it up. A read-only original (the
 * decompiled workbench is generated and protected) is skipped rather than forced.
 */
export async function saveScript(appPath: string, filePath: string, source: string): Promise<SaveResult> {
  const modDirectory = modScriptDirectory(appPath);
  if (modDirectory === null) {
    throw new Error("Cannot find the workbench; run `pnpm run reset` first");
  }
  // Decompiled files carry a byte-order mark; keep writing one so the files stay uniform
  const text = source.startsWith("﻿") ? source : `﻿${source}`;
  const modPath = path.join(modDirectory, path.basename(filePath));
  const result: SaveResult = { written: [] };

  if (path.resolve(filePath) !== modPath) {
    if (await isWritable(filePath)) {
      await fs.promises.writeFile(filePath, text, "utf8");
      result.written.push(filePath);
    } else {
      result.readOnly = filePath;
    }
  }

  await fs.promises.mkdir(modDirectory, { recursive: true });
  await fs.promises.writeFile(modPath, text, "utf8");
  result.written.push(modPath);
  return result;
}

async function isWritable(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** Basenames of the `.linscript` files in the mod script directory: the scripts that have been modified. */
export async function listModifiedScripts(appPath: string): Promise<string[]> {
  const modDirectory = modScriptDirectory(appPath);
  if (modDirectory === null || !fs.existsSync(modDirectory)) {
    return [];
  }
  const entries = await fs.promises.readdir(modDirectory, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".linscript")).map((entry) => entry.name);
}

export type LoadedScript = {
  /** The file actually read: the mod copy when one exists, otherwise `filePath`. */
  path: string;
  source: string;
  /** True when the mod copy was read instead of the requested file. */
  fromMod: boolean;
};

/**
 * Read a script for editing. Saves land in the mod script directory, so when that holds a copy of
 * the requested file it is the current version and is read in place of the original.
 */
export async function loadScript(appPath: string, filePath: string): Promise<LoadedScript> {
  const modDirectory = modScriptDirectory(appPath);
  const modPath = modDirectory === null ? null : path.join(modDirectory, path.basename(filePath));
  const useMod = modPath !== null && path.resolve(filePath) !== modPath && fs.existsSync(modPath);
  const target = useMod ? modPath : filePath;
  const source = await fs.promises.readFile(target, "utf8");
  return { path: target, source, fromMod: useMod };
}

export type ScriptSearchHit = {
  /** Forward-slash path relative to the searched directory. */
  path: string;
  /** 1-based line number of the hit. */
  lineNumber: number;
  /** The matching line, trimmed. */
  text: string;
};

export type ScriptSearchResult = {
  hits: ScriptSearchHit[];
  /** How many files were searched. */
  fileCount: number;
  /** True when more lines matched than `hits` holds. */
  truncated: boolean;
};

/** Case-insensitive substring search of every `.linscript` under `directory`, at most `limit` hits. */
export async function searchScripts(directory: string, query: string, limit = 500): Promise<ScriptSearchResult> {
  const needle = query.toLowerCase();
  const files = await listLinscriptFiles(directory);
  const hits: ScriptSearchHit[] = [];
  let truncated = false;
  if (needle === "") {
    return { hits, fileCount: files.length, truncated };
  }
  for (const file of files) {
    const source = await fs.promises.readFile(path.join(directory, file), "utf8");
    const lines = source.split("\n");
    for (let index = 0; index < lines.length; index++) {
      if (lines[index].toLowerCase().includes(needle)) {
        if (hits.length >= limit) {
          truncated = true;
          return { hits, fileCount: files.length, truncated };
        }
        hits.push({ path: file, lineNumber: index + 1, text: lines[index].trim() });
      }
    }
  }
  return { hits, fileCount: files.length, truncated };
}
