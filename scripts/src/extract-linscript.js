#!/usr/bin/env node

import { readFile, mkdir, rm, writeFile, readdir, copyFile, chmod } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import unzipper from 'unzipper';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

const WORKSPACE_DIR = join(projectRoot, 'workspace');
const BASE_FILES_ZIP = join(WORKSPACE_DIR, 'base_files.zip');
const TEMP_DIR = join(WORKSPACE_DIR, 'temp_extract');
const LINSCRIPT_EXPLORATION_DIR = join(projectRoot, 'workspace', 'linscript-exploration');
const LIN_COMPILER_PATH = join(projectRoot, 'lin-compiler', 'lin_compiler', 'bin', 'Release', 'net8.0', 'lin_compiler.dll');

async function extractWadFromZip() {
  console.log('Extracting dr1_data_us.wad from base_files.zip...');

  const zipBuffer = await readFile(BASE_FILES_ZIP);
  const directory = await unzipper.Open.buffer(zipBuffer);

  const wadFile = directory.files.find(f => f.path === 'dr1_data_us.wad');

  if (!wadFile) {
    throw new Error('dr1_data_us.wad not found in base_files.zip');
  }

  const wadBuffer = await wadFile.buffer();
  const tempWadPath = join(TEMP_DIR, 'dr1_data_us.wad');

  await mkdir(TEMP_DIR, { recursive: true });
  await writeFile(tempWadPath, wadBuffer);

  return tempWadPath;
}

async function extractWadContents(wadPath) {
  console.log('Extracting WAD contents...');

  const wadArchiverPath = join(projectRoot, 'scripts/src/wad-archiver.js');
  const extractDir = join(TEMP_DIR, 'extracted');

  await mkdir(extractDir, { recursive: true });

  await execAsync(
    `node "${wadArchiverPath}" extract "${wadPath}" "${extractDir}" --silent`,
    { maxBuffer: 50 * 1024 * 1024 }
  );

  return extractDir;
}

async function decompileLinFiles(extractDir) {
  console.log('Decompiling .lin files...');

  const scriptDir = join(extractDir, 'Dr1/data/us/script');

  if (!existsSync(scriptDir)) {
    throw new Error(`Script directory not found: ${scriptDir}`);
  }

  if (!existsSync(LIN_COMPILER_PATH)) {
    throw new Error('lin_compiler not found. Please build it first with: pnpm lin-compiler:build');
  }

  // Run the lin-compiler in batch decompile mode
  await execAsync(
    `dotnet "${LIN_COMPILER_PATH}" -s -d "${scriptDir}"`,
    { maxBuffer: 50 * 1024 * 1024 }
  );

  return scriptDir;
}

async function copyLinscriptFiles(scriptDir) {
  console.log('Copying .linscript files to linscript-exploration...');

  await mkdir(LINSCRIPT_EXPLORATION_DIR, { recursive: true });

  const files = await readdir(scriptDir);
  const linscriptFiles = files.filter(f => f.endsWith('.linscript'));

  let copiedCount = 0;
  for (const file of linscriptFiles) {
    const sourcePath = join(scriptDir, file);
    const destPath = join(LINSCRIPT_EXPLORATION_DIR, file);

    // Remove read-only flag if file exists
    try {
      await chmod(destPath, 0o644);
    } catch (err) {
      // File doesn't exist yet, ignore
    }

    await copyFile(sourcePath, destPath);
    copiedCount++;
  }

  console.log(`Copied ${copiedCount} .linscript files`);
  return linscriptFiles;
}

async function makeFilesReadonly(files) {
  console.log('Making files read-only...');

  for (const file of files) {
    const filePath = join(LINSCRIPT_EXPLORATION_DIR, file);
    // chmod 0o444 = r--r--r-- (read-only for owner, group, and others)
    await chmod(filePath, 0o444);
  }

  console.log(`Set ${files.length} files to read-only`);
}

async function cleanup() {
  console.log('Cleaning up temporary directory...');
  await rm(TEMP_DIR, { recursive: true, force: true });
}

async function main() {
  try {
    console.log('Starting linscript extraction...\n');

    // Step 1: Extract WAD from ZIP
    const wadPath = await extractWadFromZip();

    // Step 2: Extract WAD contents
    const extractDir = await extractWadContents(wadPath);

    // Step 3: Decompile .lin files to .linscript
    const scriptDir = await decompileLinFiles(extractDir);

    // Step 4: Copy .linscript files to linscript-exploration
    const linscriptFiles = await copyLinscriptFiles(scriptDir);

    // Step 5: Make files read-only
    await makeFilesReadonly(linscriptFiles);

    // Step 6: Remove temporary directory
    await cleanup();

    console.log('\n✓ Complete! Linscript files are in linscript-exploration/');
  } catch (error) {
    console.error(`Error: ${error.message}`);

    // Attempt cleanup on error
    try {
      await rm(TEMP_DIR, { recursive: true, force: true });
    } catch { }

    process.exit(1);
  }
}

main();
