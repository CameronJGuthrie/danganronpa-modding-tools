#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rename, rm, stat } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { compileDirectory } from "lin-compiler";
import { rebuildPak } from "../formats/pak-archiver.ts";
import { errorMessage } from "../lib/errors.ts";
import { collectModPaks, collectModScripts, type ModPak, type ModScript, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { PROJECT_ROOT, WAD_ARCHIVER_CLI as WAD_ARCHIVER, WORKBENCH_DIR } from "../lib/paths.ts";
import { ProgressBar } from "../lib/progress.ts";
import { getGameDirectoryOrThrow } from "../lib/steam-paths.ts";

// Constants
const GAME_DIR = getGameDirectoryOrThrow();
const MODS_DIR = join(WORKBENCH_DIR, "mod");
const EXTRACTED_DIR = join(WORKBENCH_DIR, "modded");
/** Flattened copies of the authored scripts are compiled here, so no `.lin` lands in `mod/`. */
const BUILD_DIR = join(WORKBENCH_DIR, "build");
/** `--verbose` logs every step and file; otherwise each WAD gets a progress bar. */
const VERBOSE = process.argv.slice(2).includes("--verbose");

/** The current WAD's progress bar; null in verbose mode. */
let progress: ProgressBar | null = null;

/** Step detail, printed only with `--verbose`. */
function log(message: string): void {
  if (VERBOSE) {
    console.log(message);
  }
}

/** Errors are printed in both modes, clearing the progress bar first so they get their own line. */
function logError(message: string): void {
  progress?.clear();
  console.error(message);
}

/** The authored `.linscript` files of a mod WAD, keyed by flat name; empty when it has no script directory. */
async function findModScripts(modPath: string): Promise<Map<string, ModScript>> {
  const modScriptDir = join(modPath, ...SCRIPT_DIR_SEGMENTS);
  if (!existsSync(modScriptDir)) {
    log("  No script directory found, skipping linscript compilation");
    return new Map();
  }
  return collectModScripts(modScriptDir);
}

/**
 * Copy every authored `.linscript` (flat or `chapter_CC/scene_SSS/NNN.linscript`) into one
 * flat staging directory under their game names. Returns the staging script dir.
 */
async function organiseLinscripts(modPath: string, buildPath: string, scripts: Map<string, ModScript>): Promise<string> {
  log("  Organising .linscript files...");

  const modScriptDir = join(modPath, ...SCRIPT_DIR_SEGMENTS);
  const stagingDir = join(buildPath, ...SCRIPT_DIR_SEGMENTS);
  await mkdir(stagingDir, { recursive: true });

  for (const script of scripts.values()) {
    const source = relative(modScriptDir, script.path);
    const target = `${script.name}.linscript`;
    if (source !== target) {
      log(`    ${source} -> ${target}`);
    }
    await copyFile(script.path, join(stagingDir, target));
  }

  log(`  ✓ Organised ${scripts.size} .linscript file(s)`);
  return stagingDir;
}

/** Compile every staged `.linscript` in place; returns how many succeeded, or throws when any fail. */
async function compileLinscripts(stagingDir: string): Promise<number> {
  log(`  Compiling .linscript files in ${relative(BUILD_DIR, stagingDir)}...`);

  let started = false;
  const result = await compileDirectory(stagingDir, (fileName) => {
    // Called before each file, so the previous one has finished
    if (started) {
      progress?.tick(fileName);
    } else {
      progress?.setStatus(fileName);
      started = true;
    }
  });
  if (started) {
    progress?.tick("compiled");
  }
  for (const failure of result.failed) {
    logError(`    ${basename(failure.file)}: ${failure.error.message}`);
  }
  if (result.failed.length > 0) {
    logError("  ✗ Linscript compilation failed");
    throw new Error(`Linscript compilation failed (${result.failed.length} file(s))`);
  }

  log(`  ✓ Compiled ${result.succeeded.length} .linscript file(s) to .lin`);
  return result.succeeded.length;
}

async function moveCompiledLins(stagingDir: string, extractedPath: string): Promise<void> {
  log("  Moving compiled .lin files to modded directory...");

  const extractedScriptDir = join(extractedPath, ...SCRIPT_DIR_SEGMENTS);
  await mkdir(extractedScriptDir, { recursive: true });

  // Move every compiled .lin into modded/, overwriting the existing ones
  const lins = (await readdir(stagingDir)).filter((name) => name.endsWith(".lin"));
  for (const name of lins) {
    await rename(join(stagingDir, name), join(extractedScriptDir, name));
  }
  log(`  ✓ Moved ${lins.length} compiled .lin file(s)`);
}

/**
 * Rewrite the modded copy of `pak.relativePakPath` with the entries authored in its `pak_`
 * directory: `.linscript` entries are staged and compiled under the same relative path in the
 * build directory first, other files are packed as they are. Returns how many entries were
 * compiled.
 */
async function rebuildModPak(pak: ModPak, buildPath: string, extractedPath: string): Promise<number> {
  const pakPath = join(extractedPath, pak.relativePakPath);
  log(`  Rebuilding ${pak.relativePakPath} (${pak.entries.size} entries)...`);
  if (!existsSync(pakPath)) {
    throw new Error(`${pak.relativePakPath} is not in ${extractedPath}; the mod's pak_ directory has nothing to replace entries of`);
  }

  const stagingDir = join(buildPath, dirname(pak.relativePakPath), basename(pak.path));
  await mkdir(stagingDir, { recursive: true });

  const replacements = new Map<number, Buffer>();
  let compiled = 0;
  const toCompile = [...pak.entries.values()].filter((entry) => entry.compile);
  for (const entry of toCompile) {
    await copyFile(entry.path, join(stagingDir, basename(entry.path)));
  }
  if (toCompile.length > 0) {
    compiled = await compileLinscripts(stagingDir);
  }
  for (const entry of pak.entries.values()) {
    const source = entry.compile
      ? join(stagingDir, `${basename(entry.path, ".linscript")}.lin`)
      : entry.path;
    replacements.set(entry.index, await readFile(source));
    log(`    entry ${entry.index} <- ${relative(dirname(pak.path), entry.path)}`);
  }

  await rebuildPak(pakPath, replacements, pakPath);
  progress?.tick(basename(pakPath));
  log(`  ✓ Rebuilt ${pak.relativePakPath}`);
  return compiled;
}

async function buildMods(): Promise<void> {
  log(`Using game directory: ${GAME_DIR}\n`);

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
  let totalPaksRebuilt = 0;

  for (const modDir of modDirs) {
    const modPath = join(MODS_DIR, modDir);
    const stats = await stat(modPath);

    // Only WAD directories are mods; dot-directories such as a nested .git are not
    if (!stats.isDirectory() || modDir.startsWith(".")) {
      continue;
    }

    // The directory name should match the .wad filename (e.g., dr1_data_us -> dr1_data_us.wad)
    const wadName = `${modDir}.wad`;
    const outputPath = join(GAME_DIR, wadName);

    log(`\nBuilding ${wadName}...`);
    if (!VERBOSE) {
      progress = new ProgressBar(wadName, 1);
    }

    // Check if corresponding modded directory exists
    const extractedPath = join(EXTRACTED_DIR, modDir);
    if (!existsSync(extractedPath)) {
      logError(`  ✗ Extracted directory not found: ${extractedPath}`);
      logError(`  Please extract ${wadName} first`);
      progress = null;
      errorCount++;
      continue;
    }

    try {
      const buildPath = join(BUILD_DIR, modDir);
      const scripts = await findModScripts(modPath);
      const paks = await collectModPaks(modPath);
      await rm(buildPath, { recursive: true, force: true });

      // One step per script compiled, one per pak entry compiled plus one per pak rewritten, and one for packing the WAD
      const pakSteps = paks.reduce((sum, pak) => sum + [...pak.entries.values()].filter((e) => e.compile).length + 1, 0);
      progress?.setTotal(scripts.size + pakSteps + 1);

      if (scripts.size > 0) {
        // Step 1: Flatten the authored .linscript files into the staging directory
        const stagingDir = await organiseLinscripts(modPath, buildPath, scripts);

        // Step 2: Compile .linscript files to .lin in the staging directory
        totalLinscriptsCompiled += await compileLinscripts(stagingDir);

        // Step 3: Move compiled .lin files to modded directory
        await moveCompiledLins(stagingDir, extractedPath);
      } else {
        log("  No .linscript files found, skipping linscript compilation");
      }

      // Step 4: Rewrite every .pak that has a pak_ directory in the mod
      for (const pak of paks) {
        totalLinscriptsCompiled += await rebuildModPak(pak, buildPath, extractedPath);
        totalPaksRebuilt++;
      }

      // Step 5: Use wad-archiver to pack the modded directory
      progress?.setStatus("packing");
      execSync(`node "${WAD_ARCHIVER}" create ${VERBOSE ? "" : "--silent "}"${extractedPath}" "${outputPath}"`, {
        stdio: "inherit",
        cwd: PROJECT_ROOT,
      });

      log(`✓ Successfully built ${wadName} to game directory`);
      progress?.tick("done");
      progress?.finish(`✓ ${wadName}`);
      successCount++;
    } catch (error) {
      logError(`  ${errorMessage(error)}`);
      logError(`✗ Failed to build ${wadName}`);
      errorCount++;
    }
    progress = null;
  }

  log(`\n=== Build Complete ===`);
  console.log(`WADs built: ${successCount}`);
  console.log(`WADs failed: ${errorCount}`);
  console.log(`Linscripts compiled: ${totalLinscriptsCompiled}`);
  console.log(`Paks rebuilt: ${totalPaksRebuilt}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

buildMods().catch((err: unknown) => {
  console.error("Error:", errorMessage(err));
  process.exit(1);
});
