/**
 * Mods live side by side under `workbench/mod/<mod>/`, each holding the WAD directories it
 * changes (`dr1_data_us/Dr1/data/us/script/...`, see `mod-scripts.ts`). Every mod command takes
 * `--mod <name>` (or `--mod=<name>`) and works on `workbench/mod/default/` when it is absent:
 *
 *   pnpm run build --mod silly
 *   pnpm run game --mod silly
 *
 * `workbench/mod/` also holds material shared by the mods (`tone/`, `snippets/`, the
 * gift-dialogue generator and its tables); a directory there is a mod only when it contains a
 * game WAD directory.
 */

import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { WAD_FILES } from "./base-files.ts";
import { WORKBENCH_DIR } from "./paths.ts";

/** The directory holding every mod. */
export const MODS_DIR = join(WORKBENCH_DIR, "mod");
export const DEFAULT_MOD = "default";
/** Everything the build produces lives under `workbench/build/<mod>/`. */
export const BUILD_DIR = join(WORKBENCH_DIR, "build");

/** The root of `mod`: `workbench/mod/<mod>`. */
export function modDir(mod: string): string {
  return join(MODS_DIR, mod);
}

/** Where `mod`'s build output goes: `workbench/build/<mod>`. */
export function modBuildDir(mod: string): string {
  return join(BUILD_DIR, mod);
}

/**
 * The mod named by `--mod <name>` or `--mod=<name>` in `argv`, or `default`. A name must be a
 * plain directory name (no path separators) so it cannot point outside `workbench/mod`.
 */
export function modNameFromArgs(argv: readonly string[]): string {
  let name: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mod") {
      name = argv[i + 1];
      if (name === undefined || name.startsWith("-")) {
        throw new Error("--mod needs a mod name, e.g. --mod silly");
      }
    } else if (arg.startsWith("--mod=")) {
      name = arg.slice("--mod=".length);
    }
  }
  name ??= DEFAULT_MOD;
  if (name === "" || name.startsWith(".") || /[\\/]/.test(name)) {
    throw new Error(`Not a mod name: ${JSON.stringify(name)} (expected a directory name under workbench/mod)`);
  }
  return name;
}

/** `argv` without the `--mod` option and its value, for commands that take other arguments. */
export function withoutModArg(argv: readonly string[]): string[] {
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--mod") {
      i++;
    } else if (!arg.startsWith("--mod=")) {
      rest.push(arg);
    }
  }
  return rest;
}

/** True when `dir` holds a directory named after a game WAD (`dr1_data_us`), which is what makes it a mod. */
export function isModDir(dir: string): boolean {
  return WAD_FILES.some((wad) => existsSync(join(dir, wad.replace(/\.wad$/, ""))));
}

/** The names of every mod directory, sorted; the shared folders beside them are left out. */
export async function listMods(): Promise<string[]> {
  if (!existsSync(MODS_DIR)) {
    return [];
  }
  const entries = await readdir(MODS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && isModDir(join(MODS_DIR, entry.name)))
    .map((entry) => entry.name)
    .sort();
}

/** `modDir(mod)`, or an error naming the mods that do exist when it is missing. */
export async function requireModDir(mod: string): Promise<string> {
  const dir = modDir(mod);
  if (existsSync(dir)) {
    return dir;
  }
  const mods = await listMods();
  const known = mods.length > 0 ? `known mods: ${mods.join(", ")}` : `create ${dir} first`;
  throw new Error(`Mod not found: ${dir} (${known})`);
}
