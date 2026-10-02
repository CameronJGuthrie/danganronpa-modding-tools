import { chmod, copyFile, mkdir } from "node:fs/promises";
import * as path from "node:path";
import { findModScript, SCRIPT_DIR_SEGMENTS } from "danganronpa-scripts/src/lib/mod-scripts.ts";
import type { CompilerClient } from "./compiler";

/** The mod this extension edits; the authored scripts live under `<workbench>/mod/<wad>/Dr1/data/us/script`. */
const MOD_WAD = "dr1_data_us";

/** Where an authored copy of the script named by `file` goes: the existing authored file, or a new flat one. */
async function modOutputFile(workbenchRoot: string, file: string): Promise<string> {
  const scriptDir = path.join(workbenchRoot, "mod", MOD_WAD, ...SCRIPT_DIR_SEGMENTS);
  const flatName = path.basename(file, path.extname(file));
  return (await findModScript(scriptDir, flatName)) ?? path.join(scriptDir, `${flatName}.linscript`);
}

/**
 * "Select for Modding": make a writable `.linscript` for `file` in the mod script directory and
 * return its path. A `.lin` is decompiled there (off-thread, through the compiler worker); a
 * `.linscript` is copied. An existing authored file for the same script is reused and overwritten.
 */
export async function selectScript(compiler: CompilerClient, workbenchRoot: string, file: string): Promise<string> {
  const output = await modOutputFile(workbenchRoot, file);
  if (path.resolve(file) === path.resolve(output)) {
    return output; // already the authored file
  }
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
