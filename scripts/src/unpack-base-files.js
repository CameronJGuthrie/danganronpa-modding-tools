#!/usr/bin/env node

/**
 * unpack-base-files.js
 *
 * Extracts dr1_data_us.wad and dr1_data.wad from base_files.zip and unpacks all files to workspace/modded/
 * This gives you a fresh copy of all base game files for modding.
 */

import { readFile, mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import unzipper from 'unzipper';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

const WORKSPACE_DIR = join(projectRoot, 'workspace');
const BASE_FILES_ZIP = join(WORKSPACE_DIR, 'base_files.zip');
const MODDED_DIR = join(WORKSPACE_DIR, 'modded');
const DR1_DATA_US_DIR = join(MODDED_DIR, 'dr1_data_us');
const DR1_DATA_DIR = join(MODDED_DIR, 'dr1_data');

async function extractWadFromZip(wadFileName) {
  console.log(`Extracting ${wadFileName} from base_files.zip...`);

  const zipBuffer = await readFile(BASE_FILES_ZIP);
  const directory = await unzipper.Open.buffer(zipBuffer);

  const wadFile = directory.files.find(f => f.path === wadFileName);

  if (!wadFile) {
    throw new Error(`${wadFileName} not found in base_files.zip`);
  }

  const wadBuffer = await wadFile.buffer();
  const tempWadPath = join(WORKSPACE_DIR, `temp_${wadFileName}`);

  await writeFile(tempWadPath, wadBuffer);
  console.log(`Extracted to ${tempWadPath}`);

  return tempWadPath;
}

async function extractWadContents(wadPath, outputDir) {
  console.log(`Extracting WAD contents to ${outputDir}...`);

  const wadArchiverPath = join(projectRoot, 'scripts/src/wad-archiver.js');

  // Remove existing directory if it exists
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const { stdout, stderr } = await execAsync(
    `node "${wadArchiverPath}" extract "${wadPath}" "${outputDir}"`,
    { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer for large output
  );

  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

async function cleanup(tempWadPath) {
  console.log('Cleaning up temporary files...');
  await rm(tempWadPath, { force: true });
}

async function main() {
  try {
    console.log('Starting unpack-base-files...\n');

    // Extract and process dr1_data_us.wad
    console.log('Processing dr1_data_us.wad...');
    const tempWadPathUs = await extractWadFromZip('dr1_data_us.wad');
    await extractWadContents(tempWadPathUs, DR1_DATA_US_DIR);
    await cleanup(tempWadPathUs);
    console.log('✓ dr1_data_us.wad extracted to workspace/modded/dr1_data_us/\n');

    // Extract and process dr1_data.wad
    console.log('Processing dr1_data.wad...');
    const tempWadPath = await extractWadFromZip('dr1_data.wad');
    await extractWadContents(tempWadPath, DR1_DATA_DIR);
    await cleanup(tempWadPath);
    console.log('✓ dr1_data.wad extracted to workspace/modded/dr1_data/\n');

    console.log('\n✓ All files extracted successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
