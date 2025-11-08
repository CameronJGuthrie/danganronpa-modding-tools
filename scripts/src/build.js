#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { getGameDirectoryOrThrow } from './steam-paths.js';

// Constants
const GAME_DIR = getGameDirectoryOrThrow();
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const MODS_DIR = join(PROJECT_ROOT, 'workspace', 'mod');
const EXTRACTED_DIR = join(PROJECT_ROOT, 'workspace', 'modded');
const WAD_ARCHIVER = join(PROJECT_ROOT, 'scripts', 'src', 'wad-archiver.js');
const LIN_COMPILER = join(PROJECT_ROOT, 'lin-compiler', 'lin_compiler', 'bin', 'Release', 'net8.0', 'lin_compiler.dll');

async function compileLinscripts(modPath) {
  console.log('  Compiling .linscript files...');

  // Find all .linscript files in the mod directory
  const scriptDir = join(modPath, 'Dr1', 'data', 'us', 'script');

  if (!existsSync(scriptDir)) {
    console.log('  No script directory found, skipping linscript compilation');
    return { succeeded: 0, failed: 0 };
  }

  try {
    // Use lin-compiler in batch mode to compile the directory
    // Note: compiler outputs errors to stderr and summary to stdout
    const result = execSync(`dotnet "${LIN_COMPILER}" -s "${scriptDir}" 2>&1`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    });

    // Parse the output for statistics
    const match = result.match(/Batch complete: (\d+) succeeded, (\d+) failed/);
    const succeeded = match ? parseInt(match[1]) : 0;
    const failed = match ? parseInt(match[2]) : 0;

    // Show full output if there were errors
    if (failed > 0) {
      console.error(result);
      console.error('  ✗ Linscript compilation failed');
      throw new Error('Linscript compilation failed');
    }

    console.log(`  ✓ Compiled ${succeeded} .linscript file(s) to .lin`);
    return { succeeded, failed };
  } catch (error) {
    console.error('  ✗ Failed to compile .linscript files');
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function moveCompiledLins(modPath, extractedPath) {
  console.log('  Moving compiled .lin files to modded directory...');

  const modScriptDir = join(modPath, 'Dr1', 'data', 'us', 'script');
  const extractedScriptDir = join(extractedPath, 'Dr1', 'data', 'us', 'script');

  if (!existsSync(modScriptDir)) {
    console.log('  No script directory found, skipping');
    return;
  }

  try {
    // Move all .lin files from mod/ to modded/, overwriting existing ones
    execSync(`find "${modScriptDir}" -name "*.lin" -exec mv {} "${extractedScriptDir}"/ \\;`, {
      stdio: 'pipe',
      cwd: PROJECT_ROOT
    });
    console.log('  ✓ Moved compiled .lin files');
  } catch (error) {
    console.error('  ✗ Failed to move .lin files');
    throw error;
  }
}

async function buildMods() {
  console.log(`Using game directory: ${GAME_DIR}\n`);

  // Check if mod directory exists
  if (!existsSync(MODS_DIR)) {
    console.error(`Error: Mods directory not found: ${MODS_DIR}`);
    process.exit(1);
  }

  // Check if wad-archiver exists
  if (!existsSync(WAD_ARCHIVER)) {
    console.error(`Error: wad-archiver.js not found: ${WAD_ARCHIVER}`);
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
      // Step 1: Compile .linscript files to .lin in mod directory
      const compileStats = await compileLinscripts(modPath);
      totalLinscriptsCompiled += compileStats.succeeded;

      // Step 2: Move compiled .lin files to modded directory
      await moveCompiledLins(modPath, extractedPath);

      // Step 3: Use wad-archiver to pack the modded directory
      execSync(`node "${WAD_ARCHIVER}" create "${extractedPath}" "${outputPath}"`, {
        stdio: 'inherit',
        cwd: PROJECT_ROOT
      });

      console.log(`✓ Successfully built ${wadName} to game directory`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to build ${wadName}`);
      errorCount++;
    }
  }

  console.log(`\n=== Build Complete ===`);
  console.log(`WADs built: ${successCount}`);
  console.log(`WADs failed: ${errorCount}`);
  console.log(`Linscripts compiled: ${totalLinscriptsCompiled}`);

  if (successCount > 0) {
    console.log('\nTip: Run "pnpm clear-proton" if the game doesn\'t see your changes');
  }

  if (errorCount > 0) {
    process.exit(1);
  }
}

buildMods().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
