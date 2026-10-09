#!/usr/bin/env node

/**
 * backup-game-files.ts
 *
 * Backs up the 4 .wad files from the Steam game directory into
 * workbench/base_files/ as plain copies.
 */

import { stat } from "node:fs/promises";
import { join } from "node:path";
import { BASE_FILES_DIR, backupWad, WAD_FILES } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { getGameDirectoryOrThrow } from "../lib/steam-paths.ts";

const GAME_DIR = getGameDirectoryOrThrow();

const megabytes = (bytes: number): string => (bytes / 1024 / 1024).toFixed(2);

async function backupGameFiles(): Promise<void> {
  console.log("Starting backup-game-files...\n");
  console.log(`Using game directory: ${GAME_DIR}\n`);

  let filesAdded = 0;
  let totalSize = 0;
  for (const wadFile of WAD_FILES) {
    const wadPath = join(GAME_DIR, wadFile);

    let size: number;
    try {
      size = (await stat(wadPath)).size;
    } catch {
      console.warn(`Warning: Could not find ${wadFile}, skipping...`);
      continue;
    }

    console.log(`Copying ${wadFile} (${megabytes(size)} MB)...`);
    await backupWad(wadPath, wadFile);
    filesAdded++;
    totalSize += size;
  }

  if (filesAdded === 0) {
    console.error("Error: No .wad files found in game directory");
    process.exit(1);
  }

  console.log(`\n✓ Backed up ${filesAdded} files to ${BASE_FILES_DIR}`);
  console.log(`✓ Total size: ${megabytes(totalSize)} MB`);
}

backupGameFiles().catch((error: unknown) => {
  console.error(`Error: ${errorMessage(error)}`);
  process.exit(1);
});
