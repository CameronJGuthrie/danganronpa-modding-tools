#!/usr/bin/env node

/**
 * zip-game-files.js
 *
 * Creates a backup zip of the 4 .wad files from the Steam game directory
 * and saves it as base_files.zip in the workspace directory.
 */

import { createWriteStream } from 'fs';
import { stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import archiver from 'archiver';
import { getGameDirectoryOrThrow } from './steam-paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');

const GAME_DIR = getGameDirectoryOrThrow();
const WORKSPACE_DIR = join(PROJECT_ROOT, 'workspace');
const OUTPUT_ZIP = join(WORKSPACE_DIR, 'base_files.zip');

// The 4 .wad files to backup
const WAD_FILES = [
  'dr1_data.wad',
  'dr1_data_us.wad',
  'dr1_data_keyboard_us.wad',
  'dr1_data_keyboard.wad'
];

async function zipGameFiles() {
  console.log('Starting zip-game-files...\n');
  console.log(`Using game directory: ${GAME_DIR}\n`);

  // Create output stream
  const output = createWriteStream(OUTPUT_ZIP);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  // Listen for archive events
  output.on('close', () => {
    const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`\n✓ Archive created: ${OUTPUT_ZIP}`);
    console.log(`✓ Total size: ${sizeMB} MB`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn(`Warning: ${err.message}`);
    } else {
      throw err;
    }
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Add each .wad file to the archive
  let filesAdded = 0;
  for (const wadFile of WAD_FILES) {
    const wadPath = join(GAME_DIR, wadFile);

    try {
      const stats = await stat(wadPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

      console.log(`Adding ${wadFile} (${sizeMB} MB)...`);
      archive.file(wadPath, { name: wadFile });
      filesAdded++;
    } catch (error) {
      console.warn(`Warning: Could not find ${wadFile}, skipping...`);
    }
  }

  if (filesAdded === 0) {
    console.error('Error: No .wad files found in game directory');
    process.exit(1);
  }

  // Finalize the archive
  await archive.finalize();
}

// Run the script
zipGameFiles().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
