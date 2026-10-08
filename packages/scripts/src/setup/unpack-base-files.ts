#!/usr/bin/env node

/**
 * unpack-base-files.ts
 *
 * Restores dr1_data_us.wad and dr1_data.wad from workbench/base_files/ and unpacks all files to workbench/modded/
 * This gives you a fresh copy of all base game files for modding.
 */

import { exec } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { restoreWad, type WadFile } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { WAD_ARCHIVER_CLI, WORKBENCH_DIR } from "../lib/paths.ts";

const execAsync = promisify(exec);
const MODDED_DIR = join(WORKBENCH_DIR, "modded");
const DR1_DATA_US_DIR = join(MODDED_DIR, "dr1_data_us");
const DR1_DATA_DIR = join(MODDED_DIR, "dr1_data");

async function restoreWadToTemp(wadFileName: WadFile): Promise<string> {
  console.log(`Restoring ${wadFileName} from base_files...`);

  const tempWadPath = join(WORKBENCH_DIR, `temp_${wadFileName}`);
  await restoreWad(wadFileName, tempWadPath);
  console.log(`Restored to ${tempWadPath}`);

  return tempWadPath;
}

async function extractWadContents(wadPath: string, outputDir: string): Promise<void> {
  console.log(`Extracting WAD contents to ${outputDir}...`);

  // Remove existing directory if it exists
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  const { stdout, stderr } = await execAsync(
    `node "${WAD_ARCHIVER_CLI}" extract "${wadPath}" "${outputDir}"`,
    { maxBuffer: 50 * 1024 * 1024 }, // 50MB buffer for large output
  );

  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
}

async function cleanup(tempWadPath: string): Promise<void> {
  console.log("Cleaning up temporary files...");
  await rm(tempWadPath, { force: true });
}

async function main(): Promise<void> {
  try {
    console.log("Starting unpack-base-files...\n");

    // Extract and process dr1_data_us.wad
    console.log("Processing dr1_data_us.wad...");
    const tempWadPathUs = await restoreWadToTemp("dr1_data_us.wad");
    await extractWadContents(tempWadPathUs, DR1_DATA_US_DIR);
    await cleanup(tempWadPathUs);
    console.log("✓ dr1_data_us.wad extracted to workbench/modded/dr1_data_us/\n");

    // Extract and process dr1_data.wad
    console.log("Processing dr1_data.wad...");
    const tempWadPath = await restoreWadToTemp("dr1_data.wad");
    await extractWadContents(tempWadPath, DR1_DATA_DIR);
    await cleanup(tempWadPath);
    console.log("✓ dr1_data.wad extracted to workbench/modded/dr1_data/\n");

    console.log("\n✓ All files extracted successfully!");
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
