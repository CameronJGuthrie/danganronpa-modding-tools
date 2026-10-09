#!/usr/bin/env node

import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { compileDirectory } from "lin-compiler";
import { rebuildPak } from "../formats/pak-archiver.ts";
import { createWad, readWadEntry } from "../formats/wad-archiver.ts";
import { baseFilePath, WAD_FILES, type WadFile } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import {
  collectModPaks,
  collectModScripts,
  type ModPak,
  type ModScript,
  SCRIPT_DIR_SEGMENTS,
} from "../lib/mod-scripts.ts";
import { modBuildDir, modNameFromArgs, requireModDir } from "../lib/mods.ts";
import { ProgressBar } from "../lib/progress.ts";
import { getGameDirectoryOrThrow } from "../lib/steam-paths.ts";

// Constants
const GAME_DIR = getGameDirectoryOrThrow();
/** `--mod <name>` picks the mod under `workbench/mod/`; `default` otherwise. */
const MOD = modNameFromArgs(process.argv.slice(2));
/**
 * Everything the build produces lives under `workbench/build/<mod>/`, so no `.lin` lands in
 * `mod/` and nothing else in the workbench is written: `<wad>/staging/` holds the flattened
 * `.linscript` copies while they compile, `<wad>/overlay/` the files that replace entries of the
 * base WAD when it is packed, and `<wad>.wad` the packed result, which is also copied into the
 * game directory (`pnpm run game --mod <name>` copies it again without rebuilding).
 */
const BUILD_DIR = modBuildDir(MOD);
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
async function organiseLinscripts(
  modPath: string,
  buildPath: string,
  scripts: Map<string, ModScript>,
): Promise<string> {
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

async function moveCompiledLins(stagingDir: string, overlayDir: string): Promise<void> {
  log("  Moving compiled .lin files to the overlay...");

  const overlayScriptDir = join(overlayDir, ...SCRIPT_DIR_SEGMENTS);
  await mkdir(overlayScriptDir, { recursive: true });

  const lins = (await readdir(stagingDir)).filter((name) => name.endsWith(".lin"));
  for (const name of lins) {
    await rename(join(stagingDir, name), join(overlayScriptDir, name));
  }
  log(`  ✓ Moved ${lins.length} compiled .lin file(s)`);
}

/**
 * Write the overlay's copy of `pak.relativePakPath`: the shipped pak from the base WAD with the
 * entries authored in the mod's `pak_` directory replaced. `.linscript` entries are staged and
 * compiled under the same relative path first, other files are packed as they are. Returns how
 * many entries were compiled.
 */
async function rebuildModPak(pak: ModPak, baseWad: string, stagingRoot: string, overlayDir: string): Promise<number> {
  log(`  Rebuilding ${pak.relativePakPath} (${pak.entries.size} entries)...`);
  const stagingDir = join(stagingRoot, dirname(pak.relativePakPath), basename(pak.path));
  await mkdir(stagingDir, { recursive: true });

  const shippedPak = join(stagingDir, basename(pak.relativePakPath));
  try {
    await writeFile(shippedPak, await readWadEntry(baseWad, pak.relativePakPath.replace(/\\/g, "/")));
  } catch (error) {
    throw new Error(
      `${pak.relativePakPath} is not in ${basename(baseWad)}; the mod's pak_ directory has nothing to replace entries of (${errorMessage(error)})`,
    );
  }

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
    const source = entry.compile ? join(stagingDir, `${basename(entry.path, ".linscript")}.lin`) : entry.path;
    replacements.set(entry.index, await readFile(source));
    log(`    entry ${entry.index} <- ${relative(dirname(pak.path), entry.path)}`);
  }

  const pakPath = join(overlayDir, pak.relativePakPath);
  await mkdir(dirname(pakPath), { recursive: true });
  await rebuildPak(shippedPak, replacements, pakPath);
  await unlink(shippedPak);
  progress?.tick(basename(pakPath));
  log(`  ✓ Rebuilt ${pak.relativePakPath}`);
  return compiled;
}

async function buildMod(): Promise<void> {
  const modRoot = await requireModDir(MOD);
  log(`Building mod ${MOD} from ${modRoot}`);
  log(`Using game directory: ${GAME_DIR}\n`);

  // Get all directories in the mod (each should be a .wad)
  const modDirs = await readdir(modRoot);

  let successCount = 0;
  let errorCount = 0;
  let totalLinscriptsCompiled = 0;
  let totalPaksRebuilt = 0;

  for (const modDir of modDirs) {
    const modPath = join(modRoot, modDir);
    const stats = await stat(modPath);

    // Only directories named after a game WAD are built (dr1_data_us -> dr1_data_us.wad); the
    // mod's own files and directories (a nested .git, `gift-dialogue/`) are left alone
    const wadName = `${modDir}.wad`;
    if (!stats.isDirectory() || !(WAD_FILES as readonly string[]).includes(wadName)) {
      log(`Skipping ${modDir}: not a game WAD`);
      continue;
    }
    const outputPath = join(BUILD_DIR, wadName);

    log(`\nBuilding ${wadName}...`);
    if (!VERBOSE) {
      progress = new ProgressBar(wadName, 1);
    }

    // The mod replaces entries of the backed-up WAD of the same name
    const baseWad = baseFilePath(wadName as WadFile);
    if (!existsSync(baseWad)) {
      logError(`  ✗ ${wadName} is not in workbench/base_files; run "pnpm run setup" first`);
      progress = null;
      errorCount++;
      continue;
    }

    try {
      const buildPath = join(BUILD_DIR, modDir);
      const stagingRoot = join(buildPath, "staging");
      const overlayDir = join(buildPath, "overlay");
      const scripts = await findModScripts(modPath);
      const paks = await collectModPaks(modPath);
      await rm(buildPath, { recursive: true, force: true });

      // One step per script compiled, one per pak entry compiled plus one per pak rewritten, and one for packing the WAD
      const pakSteps = paks.reduce(
        (sum, pak) => sum + [...pak.entries.values()].filter((e) => e.compile).length + 1,
        0,
      );
      progress?.setTotal(scripts.size + pakSteps + 1);

      if (scripts.size > 0) {
        // Step 1: Flatten the authored .linscript files into the staging directory
        const stagingDir = await organiseLinscripts(modPath, stagingRoot, scripts);

        // Step 2: Compile .linscript files to .lin in the staging directory
        totalLinscriptsCompiled += await compileLinscripts(stagingDir);

        // Step 3: Move compiled .lin files into the overlay
        await moveCompiledLins(stagingDir, overlayDir);
      } else {
        log("  No .linscript files found, skipping linscript compilation");
      }

      // Step 4: Rewrite every .pak that has a pak_ directory in the mod
      for (const pak of paks) {
        totalLinscriptsCompiled += await rebuildModPak(pak, baseWad, stagingRoot, overlayDir);
        totalPaksRebuilt++;
      }

      // Step 5: Pack the WAD from the base WAD with the overlay's files replacing its entries
      progress?.setStatus("packing");
      await mkdir(overlayDir, { recursive: true });
      await createWad(outputPath, {
        inputDirs: [overlayDir],
        baseWad,
        onFile: (entryPath, source) => {
          if (source === "input") log(`    ${entryPath}`);
        },
      });

      // Step 6: Install it into the game directory
      await copyFile(outputPath, join(GAME_DIR, wadName));
      log(`✓ Successfully built ${wadName} and copied it to the game directory`);
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
  console.log(`Mod: ${MOD}`);
  console.log(`WADs built: ${successCount}`);
  console.log(`WADs failed: ${errorCount}`);
  console.log(`Linscripts compiled: ${totalLinscriptsCompiled}`);
  console.log(`Paks rebuilt: ${totalPaksRebuilt}`);

  if (errorCount > 0) {
    process.exit(1);
  }
}

buildMod().catch((err: unknown) => {
  console.error("Error:", errorMessage(err));
  process.exit(1);
});
