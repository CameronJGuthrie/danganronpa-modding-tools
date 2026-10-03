#!/usr/bin/env node

import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, copyFile, mkdir } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { promisify } from "node:util";
import { decompileFile } from "lin-compiler";
import { errorMessage } from "../lib/errors.ts";
import { explorationScriptPath, findModScript, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { PROJECT_ROOT as projectRoot } from "../lib/paths.ts";

const execAsync = promisify(exec);

const MODDED_DIR = join(projectRoot, "workbench", "modded", "dr1_data_us");
const MOD_DIR = join(projectRoot, "workbench", "mod", "dr1_data_us");
const EXPLORATION_DIR = join(projectRoot, "workbench", "exploration");
const MOD_SCRIPT_DIR = join(MOD_DIR, ...SCRIPT_DIR_SEGMENTS);

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
  console.log(`Usage: pnpm select <filepath>

Two modes:
1. .lin file: Decompiles from workbench/modded/ and places the .linscript in workbench/mod/
2. .linscript file: Copies from workbench/exploration/ to workbench/mod/ with proper structure

Examples:
  pnpm select e01_004_135.lin
  pnpm select Dr1/data/us/script/e01_004_135.lin
  pnpm select workbench/modded/dr1_data_us/Dr1/data/us/script/e01_004_135.lin

  pnpm select e01_004_135.linscript
  pnpm select chapter_01/scene_004/e01_004_135.linscript
  pnpm select workbench/exploration/chapter_01/scene_004/e01_004_135.linscript`);
}

function resolveLinFilePath(inputPath: string): string {
  // If it's an absolute path
  if (inputPath.startsWith("/")) {
    if (!inputPath.startsWith(MODDED_DIR)) {
      throw new Error(`File must be within ${MODDED_DIR}`);
    }
    return inputPath;
  }

  // If it's a relative path from project root
  if (inputPath.startsWith("workbench/modded/")) {
    return join(projectRoot, inputPath);
  }

  // If it's a path relative to dr1_data_us
  if (inputPath.startsWith("Dr1/")) {
    return join(MODDED_DIR, inputPath);
  }

  // If it's just a filename, assume it's in the script directory
  if (!inputPath.includes("/")) {
    return join(MODDED_DIR, "Dr1/data/us/script", inputPath);
  }

  // Otherwise, try treating it as relative to MODDED_DIR
  return join(MODDED_DIR, inputPath);
}

function resolveLinscriptFilePath(inputPath: string): string {
  // If it's an absolute path
  if (inputPath.startsWith("/")) {
    if (!inputPath.startsWith(EXPLORATION_DIR)) {
      throw new Error(`File must be within ${EXPLORATION_DIR}`);
    }
    return inputPath;
  }

  // If it's a relative path from project root
  if (inputPath.startsWith("workbench/exploration/")) {
    return join(projectRoot, inputPath);
  }

  // If it's just a filename, find it in the exploration directory's chapter/scene layout
  if (!inputPath.includes("/")) {
    return join(EXPLORATION_DIR, explorationScriptPath(basename(inputPath, ".linscript")));
  }

  // Otherwise, try treating it as relative to EXPLORATION_DIR
  return join(EXPLORATION_DIR, inputPath);
}

async function handleLinFile(inputPath: string): Promise<void> {
  // Resolve the input path
  const sourceFile = resolveLinFilePath(inputPath);

  // Check if file exists
  if (!existsSync(sourceFile)) {
    console.error(`Error: File not found: ${sourceFile}`);
    process.exit(1);
  }

  // Calculate the relative path from MODDED_DIR
  const relativePath = relative(MODDED_DIR, sourceFile);

  // Calculate the output path in MOD_DIR
  const outputBase = basename(sourceFile, ".lin");
  const outputFile = await modOutputFile(outputBase);

  console.log(`Selecting: ${relativePath}`);
  console.log(`Output:    ${relative(projectRoot, outputFile)}`);

  // Create output directory
  await mkdir(dirname(outputFile), { recursive: true });

  // Decompile the .lin file
  console.log("\nDecompiling...");
  await decompileFile(sourceFile, outputFile);

  console.log(`\n✓ Created: ${relative(projectRoot, outputFile)}`);

  // Open the file in VSCode
  try {
    await execAsync(`code "${outputFile}"`);
  } catch {
    // Silently fail if 'code' command is not available
  }
}

async function handleLinscriptFile(inputPath: string): Promise<void> {
  // Resolve the input path
  const sourceFile = resolveLinscriptFilePath(inputPath);

  // Check if file exists
  if (!existsSync(sourceFile)) {
    console.error(`Error: File not found: ${sourceFile}`);
    process.exit(1);
  }

  // Extract the base filename (e.g., e01_004_135 from e01_004_135.linscript)
  const baseFilename = basename(sourceFile, ".linscript");

  // Find the corresponding .lin file in workbench/modded
  // All script files are in Dr1/data/us/script/ directory
  const correspondingLinFile = join(MODDED_DIR, "Dr1/data/us/script", `${baseFilename}.lin`);

  if (!existsSync(correspondingLinFile)) {
    console.error(`Error: Corresponding .lin file not found: ${correspondingLinFile}`);
    console.error(`Looking for: Dr1/data/us/script/${baseFilename}.lin`);
    process.exit(1);
  }

  // Calculate the output path in MOD_DIR (refuses if the script is already selected)
  const outputFile = await modOutputFile(baseFilename);

  console.log(`Selecting: ${basename(sourceFile)}`);
  console.log(`Found:     Dr1/data/us/script/${baseFilename}.lin`);
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
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  const inputPath = args[0];

  try {
    const ext = extname(inputPath);

    if (ext === ".lin") {
      await handleLinFile(inputPath);
    } else if (ext === ".linscript") {
      await handleLinscriptFile(inputPath);
    } else {
      console.error("Error: File must be a .lin or .linscript file");
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
