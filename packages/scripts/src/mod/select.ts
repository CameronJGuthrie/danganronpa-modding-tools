#!/usr/bin/env node

import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, copyFile, mkdir } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { promisify } from "node:util";
import { errorMessage } from "../lib/errors.ts";
import { explorationScriptPath, findModScript, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { modDir, modNameFromArgs, withoutModArg } from "../lib/mods.ts";
import { EXPLORATION_DIR, PROJECT_ROOT as projectRoot } from "../lib/paths.ts";

const execAsync = promisify(exec);

/** `--mod <name>` picks the mod under `workbench/mods/`; `default` otherwise. It is created on the first select. */
const MOD = modNameFromArgs(process.argv.slice(2));
const MOD_SCRIPT_DIR = join(modDir(MOD), "dr1_data_us", ...SCRIPT_DIR_SEGMENTS);

/**
 * Where the writable copy of `flatName` goes: a new flat `<flatName>.linscript` in the mod script
 * directory. Refuses when an authored file for the script already exists there (flat or organised
 * by chapter/scene, with any label suffix), so a select never overwrites edits.
 */
async function modOutputFile(flatName: string): Promise<string> {
  const existing = await findModScript(MOD_SCRIPT_DIR, flatName);
  if (existing !== null) {
    throw new Error(
      `${flatName} is already selected: ${relative(projectRoot, existing)}\nEdit that file, or delete it to select the script again.`,
    );
  }
  return join(MOD_SCRIPT_DIR, `${flatName}.linscript`);
}

function showUsage(): void {
  console.log(`Usage: pnpm select <script> [--mod <name>]

Copies a game script from workbench/exploration/ into workbench/mods/<name>/ as a writable
.linscript (the mod "default" unless --mod says otherwise). The script can be named by its
flat name (with or without an extension) or by its path under workbench/exploration/.

Examples:
  pnpm select e01_004_135
  pnpm select e01_004_135 --mod silly
  pnpm select e01_004_135.linscript
  pnpm select e01_004_135.lin
  pnpm select chapter_01/scene_004/e01_004_135.linscript
  pnpm select workbench/exploration/chapter_01/scene_004/e01_004_135.linscript`);
}

/** The exploration `.linscript` the argument names. */
function resolveSourceFile(inputPath: string): string {
  if (inputPath.startsWith("/")) {
    if (!inputPath.startsWith(EXPLORATION_DIR)) {
      throw new Error(`File must be within ${EXPLORATION_DIR}`);
    }
    return inputPath;
  }
  if (inputPath.startsWith("workbench/exploration/")) {
    return join(projectRoot, inputPath);
  }
  if (!inputPath.includes("/")) {
    const flatName = basename(inputPath, extname(inputPath));
    return join(EXPLORATION_DIR, explorationScriptPath(flatName));
  }
  return join(EXPLORATION_DIR, inputPath);
}

async function selectScript(inputPath: string): Promise<void> {
  const sourceFile = resolveSourceFile(inputPath);
  if (!existsSync(sourceFile)) {
    console.error(`Error: File not found: ${sourceFile}`);
    process.exit(1);
  }

  // Where the writable copy goes (refuses if the script is already selected)
  const baseFilename = basename(sourceFile, ".linscript");
  const outputFile = await modOutputFile(baseFilename);

  console.log(`Selecting: ${relative(projectRoot, sourceFile)}`);
  console.log(`Output:    ${relative(projectRoot, outputFile)}`);

  // Create output directory
  await mkdir(dirname(outputFile), { recursive: true });

  // Copy the linscript file and make it writable
  await copyFile(sourceFile, outputFile);
  await chmod(outputFile, 0o644);

  console.log(`\n✓ Created writable copy: ${relative(projectRoot, outputFile)}`);

  // Open the file in VSCode
  try {
    await execAsync(`code "${outputFile}"`);
  } catch {
    // Silently fail if 'code' command is not available
  }
}

async function main(): Promise<void> {
  const args = withoutModArg(process.argv.slice(2));

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  try {
    await selectScript(args[0]);
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
