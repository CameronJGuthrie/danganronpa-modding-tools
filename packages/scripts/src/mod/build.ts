#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { errorMessage } from "../lib/errors.ts";
import { collectModScripts, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import {
  LIN_COMPILER_CLI as LIN_COMPILER,
  PROJECT_ROOT,
  WAD_ARCHIVER_CLI as WAD_ARCHIVER,
  WORKBENCH_DIR,
} from "../lib/paths.ts";
import { getGameDirectoryOrThrow } from "../lib/steam-paths.ts";

// Constants
const GAME_DIR = getGameDirectoryOrThrow();
const MODS_DIR = join(WORKBENCH_DIR, "mod");
const EXTRACTED_DIR = join(WORKBENCH_DIR, "modded");
/** Flattened copies of the authored scripts are compiled here, so no `.lin` lands in `mod/`. */
const BUILD_DIR = join(WORKBENCH_DIR, "build");

interface CompileStats {
  succeeded: number;
  failed: number;
}

/** `execSync` rejects with the child's captured output attached. */
interface ExecError extends Error {
  stdout?: string;
  stderr?: string;
}

/**
 * Gather every authored `.linscript` (flat or `chapter_CC/scene_SSS/NNN.linscript`) into one
 * flat staging directory under their game names. Returns the staging script dir, or null when
 * the mod has no scripts.
 */
async function organiseLinscripts(modPath: string, buildPath: string): Promise<string | null> {
  console.log("  Organising .linscript files...");

  const modScriptDir = join(modPath, ...SCRIPT_DIR_SEGMENTS);
  if (!existsSync(modScriptDir)) {
    console.log("  No script directory found, skipping linscript compilation");
    return null;
  }

  const scripts = await collectModScripts(modScriptDir);
  if (scripts.size === 0) {
    console.log("  No .linscript files found, skipping linscript compilation");
    return null;
  }

  const stagingDir = join(buildPath, ...SCRIPT_DIR_SEGMENTS);
  await rm(buildPath, { recursive: true, force: true });
  await mkdir(stagingDir, { recursive: true });

  for (const script of scripts.values()) {
    const source = relative(modScriptDir, script.path);
    const target = `${script.name}.linscript`;
    if (source !== target) {
      console.log(`    ${source} -> ${target}`);
    }
    await copyFile(script.path, join(stagingDir, target));
  }

  console.log(`  ✓ Organised ${scripts.size} .linscript file(s)`);
  return stagingDir;
}

async function compileLinscripts(stagingDir: string): Promise<CompileStats> {
  console.log("  Compiling .linscript files...");

  try {
    // Use lin-compiler in batch mode to compile the directory
    // Note: compiler outputs errors to stderr and summary to stdout
    const result = execSync(`node "${LIN_COMPILER}" -s "${stagingDir}" 2>&1`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
    });

    // Parse the output for statistics
    const match = result.match(/Batch complete: (\d+) succeeded, (\d+) failed/);
    const succeeded = match ? Number.parseInt(match[1], 10) : 0;
    const failed = match ? Number.parseInt(match[2], 10) : 0;

    // Show full output if there were errors
    if (failed > 0) {
      console.error(result);
      console.error("  ✗ Linscript compilation failed");
      throw new Error("Linscript compilation failed");
    }

    console.log(`  ✓ Compiled ${succeeded} .linscript file(s) to .lin`);
    return { succeeded, failed };
  } catch (error) {
    console.error("  ✗ Failed to compile .linscript files");
    const execError = error as ExecError;
    if (execError.stdout) console.error(execError.stdout);
    if (execError.stderr) console.error(execError.stderr);
    throw error;
  }
}

async function moveCompiledLins(stagingDir: string, extractedPath: string): Promise<void> {
  console.log("  Moving compiled .lin files to modded directory...");

  const extractedScriptDir = join(extractedPath, ...SCRIPT_DIR_SEGMENTS);

  try {
    // Move all .lin files from the staging dir to modded/, overwriting existing ones
    execSync(`find "${stagingDir}" -name "*.lin" -exec mv {} "${extractedScriptDir}"/ \\;`, {
      stdio: "pipe",
      cwd: PROJECT_ROOT,
    });
    console.log("  ✓ Moved compiled .lin files");
  } catch (error) {
    console.error("  ✗ Failed to move .lin files");
    throw error;
  }
}

async function buildMods(): Promise<void> {
  console.log(`Using game directory: ${GAME_DIR}\n`);

  // Check if mod directory exists
  if (!existsSync(MODS_DIR)) {
    console.error(`Error: Mods directory not found: ${MODS_DIR}`);
    process.exit(1);
  }

  // Check if wad-archiver exists
  if (!existsSync(WAD_ARCHIVER)) {
    console.error(`Error: wad-archiver.ts not found: ${WAD_ARCHIVER}`);
    process.exit(1);
  }

  // Get all directories in mod folder (each should be a .wad)
  const modDirs = await readdir(MODS_DIR);

  let successCount = 0;
  let errorCount = 0;
  let totalLinscriptsCompiled = 0;

  for (const modDir of modDirs) {
    const modPath = join(MODS_DIR, modDir);
    const stats = await stat(modPath);

    if (!stats.isDirectory()) {
      continue;
    }

    // The directory name should match the .wad filename (e.g., dr1_data_us -> dr1_data_us.wad)
    const wadName = `${modDir}.wad`;
    const outputPath = join(GAME_DIR, wadName);

    console.log(`\nBuilding ${wadName}...`);

    // Check if corresponding modded directory exists
    const extractedPath = join(EXTRACTED_DIR, modDir);
    if (!existsSync(extractedPath)) {
      console.error(`  ✗ Extracted directory not found: ${extractedPath}`);
      console.error(`  Please extract ${wadName} first`);
      errorCount++;
      continue;
    }

    try {
      // Step 1: Flatten the authored .linscript files into the staging directory
      const stagingDir = await organiseLinscripts(modPath, join(BUILD_DIR, modDir));

      if (stagingDir !== null) {
        // Step 2: Compile .linscript files to .lin in the staging directory
        const compileStats = await compileLinscripts(stagingDir);
        totalLinscriptsCompiled += compileStats.succeeded;

        // Step 3: Move compiled .lin files to modded directory
        await moveCompiledLins(stagingDir, extractedPath);
      }

      // Step 4: Use wad-archiver to pack the modded directory
      execSync(`node "${WAD_ARCHIVER}" create "${extractedPath}" "${outputPath}"`, {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
      });

      console.log(`✓ Successfully built ${wadName} to game directory`);
      successCount++;
    } catch (error) {
      console.error(`  ${errorMessage(error)}`);
      console.error(`✗ Failed to build ${wadName}`);
      errorCount++;
    }
  }

  console.log(`\n=== Build Complete ===`);
  console.log(`WADs built: ${successCount}`);
  console.log(`WADs failed: ${errorCount}`);
  console.log(`Linscripts compiled: ${totalLinscriptsCompiled}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

buildMods().catch((err: unknown) => {
  console.error("Error:", errorMessage(err));
  process.exit(1);
});
