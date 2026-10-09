import fs from "node:fs";
import path from "node:path";
import { normalizeTextQuery, textOfLine } from "../script/textSearch";

/**
 * The folder of decompiled scripts the Script Viewer opens by default: the workbench's
 * `exploration/`, organised as `chapter_CC/scene_SSS/eCC_SSS_NNN.linscript`. Null when the
 * workbench has not been generated (`pnpm run reset`).
 */
export function defaultScriptDirectory(workbenchRoot: string | null): string | null {
  if (workbenchRoot === null) {
    return null;
  }
  const directory = path.join(workbenchRoot, "exploration");
  return fs.existsSync(directory) ? directory : null;
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

/**
 * Where `pnpm select` puts writable `.linscript` copies and `pnpm build` compiles them from; the
 * viewer shows a script's copy from here when it has one. Mods are directories under
 * `workbench/mod/`; the viewer reads the mod `default`.
 * Files may be flat (`e01_005_103.linscript`) or organised as
 * `chapter_01/scene_005_AnyLabel/103_AnyLabel.linscript`; only the leading numbers name the script
 * (see `packages/scripts/src/lib/mod-scripts.ts`).
 */
export function modScriptDirectory(workbenchRoot: string | null): string | null {
  // The mod folder may not exist yet; it is enough that the workbench does
  return workbenchRoot === null ? null : path.join(workbenchRoot, "mod/default/dr1_data_us/Dr1/data/us/script");
}

const FLAT_NAME = /^(e\d{2}_\d{3}_\d{3})(?:[^\d].*)?$/;
const NESTED_PATH = /^chapter_(\d{2})(?:[^\d/][^/]*)?\/scene_(\d{3})(?:[^\d/][^/]*)?\/(\d{3})(?:[^\d].*)?$/;

/** Flat game name (`e01_005_103`) for a `.linscript` at `relativePath` inside a mod script dir, or null. */
export function flatScriptName(relativePath: string): string | null {
  const posix = relativePath.split(path.sep).join("/");
  if (!posix.endsWith(".linscript")) {
    return null;
  }
  const stem = posix.slice(0, -".linscript".length);
  const flat = FLAT_NAME.exec(path.basename(stem));
  if (flat !== null) {
    return flat[1];
  }
  const match = NESTED_PATH.exec(stem);
  return match ? `e${match[1]}_${match[2]}_${match[3]}` : null;
}

/** Absolute path of the mod file that flattens to `flatName`, if one exists in either layout. */
async function findModScript(modDirectory: string, flatName: string): Promise<string | null> {
  if (!fs.existsSync(modDirectory)) {
    return null;
  }
  for (const relativePath of await listLinscriptFiles(modDirectory)) {
    if (flatScriptName(relativePath) === flatName) {
      return path.join(modDirectory, relativePath);
    }
  }
  return null;
}

/**
 * Game-name basenames (`e01_005_103.linscript`) of every script with a copy in the mod script
 * directory, whichever layout it is stored in: the scripts that have been modified.
 */
export async function listModifiedScripts(workbenchRoot: string | null): Promise<string[]> {
  const modDirectory = modScriptDirectory(workbenchRoot);
  if (modDirectory === null || !fs.existsSync(modDirectory)) {
    return [];
  }
  const names = new Set<string>();
  for (const relativePath of await listLinscriptFiles(modDirectory)) {
    const flatName = flatScriptName(relativePath);
    if (flatName !== null) {
      names.add(`${flatName}.linscript`);
    }
  }
  return [...names].sort();
}

export type LoadedScript = {
  /** The file actually read: the mod copy when one exists, otherwise `filePath`. */
  path: string;
  source: string;
  /** True when the mod copy was read instead of the requested file. */
  fromMod: boolean;
};

/**
 * Read a script for viewing. Authored edits live in the mod script directory, so when that holds a
 * copy of the requested file it is the current version and is read in place of the original.
 */
export async function loadScript(workbenchRoot: string | null, filePath: string): Promise<LoadedScript> {
  const modDirectory = modScriptDirectory(workbenchRoot);
  const flatName = flatScriptName(path.basename(filePath));
  const modPath = modDirectory === null || flatName === null ? null : await findModScript(modDirectory, flatName);
  const useMod = modPath !== null && path.resolve(filePath) !== modPath;
  const target = useMod ? modPath : filePath;
  const source = await fs.promises.readFile(target, "utf8");
  return { path: target, source, fromMod: useMod };
}

export type ScriptSearchHit = {
  /** Forward-slash path relative to the searched directory. */
  path: string;
  /** 1-based line number of the hit. */
  lineNumber: number;
  /** The matching line, trimmed; in a text-only search, the line's readable text instead. */
  text: string;
};

export type ScriptSearchResult = {
  hits: ScriptSearchHit[];
  /** How many files were searched. */
  fileCount: number;
  /** True when more lines matched than `hits` holds. */
  truncated: boolean;
};

export type ScriptSearchOptions = {
  /**
   * Search only the player-visible text of `Text("...")` / `RawText("...")` lines, ignoring style
   * tags and treating line breaks as spaces (see `textOfLine`).
   */
  textOnly?: boolean;
  /** The most hits to return. */
  limit?: number;
};

/** Case-insensitive substring search of every `.linscript` under `directory`, at most `limit` hits. */
export async function searchScripts(
  directory: string,
  query: string,
  { textOnly = false, limit = 500 }: ScriptSearchOptions = {},
): Promise<ScriptSearchResult> {
  const needle = (textOnly ? normalizeTextQuery(query) : query).toLowerCase();
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
      const text = textOnly ? textOfLine(lines[index]) : lines[index].trim();
      if (text?.toLowerCase().includes(needle)) {
        if (hits.length >= limit) {
          truncated = true;
          return { hits, fileCount: files.length, truncated };
        }
        hits.push({ path: file, lineNumber: index + 1, text });
      }
    }
  }
  return { hits, fileCount: files.length, truncated };
}
