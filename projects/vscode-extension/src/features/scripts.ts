import { chmod, copyFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { findModScript, SCRIPT_DIR_SEGMENTS } from "danganronpa-scripts/src/lib/mod-scripts.ts";
import type { CompilerClient } from "./compiler";

/** The mod this extension edits; the authored scripts live under `<workbench>/mod/<wad>/Dr1/data/us/script`. */
const MOD_WAD = "dr1_data_us";

/** The authored script directory, `<workbench>/mod/dr1_data_us/Dr1/data/us/script`. */
export function modScriptDir(workbenchRoot: string): string {
  return path.join(workbenchRoot, "mod", MOD_WAD, ...SCRIPT_DIR_SEGMENTS);
}

/**
 * "Select for Modding": make a writable `.linscript` for `file` in the mod script directory and
 * return its path. A `.lin` is decompiled there (off-thread, through the compiler worker); a
 * `.linscript` is copied. When an authored file for the same script already exists (flat or
 * organised by chapter/scene), nothing is written and that file's path is returned, so selecting
 * again opens the edited script instead of overwriting it.
 */
export async function selectScript(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const scriptDir = modScriptDir(workbenchRoot);
  const flatName = path.basename(file, path.extname(file));
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

/** "Verify File": decompile `file` into `<workbench>/verify/` and return the `.linscript` path. */
export async function verifyScript(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const verifyDir = path.join(workbenchRoot, "verify");
  const output = path.join(verifyDir, `${path.basename(file, ".lin")}.linscript`);
  await mkdir(verifyDir, { recursive: true });
  await compiler.decompileFile(file, output);
  return output;
}
