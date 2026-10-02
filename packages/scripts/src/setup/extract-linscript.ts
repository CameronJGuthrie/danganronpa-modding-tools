#!/usr/bin/env node

import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { chmod, copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { decompileDirectory } from "lin-compiler";
import unzipper from "unzipper";
import { errorMessage } from "../lib/errors.ts";
import { WAD_ARCHIVER_CLI, WORKBENCH_DIR } from "../lib/paths.ts";

const execAsync = promisify(exec);
const BASE_FILES_ZIP = join(WORKBENCH_DIR, "base_files.zip");
const TEMP_DIR = join(WORKBENCH_DIR, "temp_extract");
const LINSCRIPT_EXPLORATION_DIR = join(WORKBENCH_DIR, "linscript-exploration");

async function extractWadFromZip(): Promise<string> {
  console.log("Extracting dr1_data_us.wad from base_files.zip...");

  const zipBuffer = await readFile(BASE_FILES_ZIP);
  const directory = await unzipper.Open.buffer(zipBuffer);

  const wadFile = directory.files.find((f) => f.path === "dr1_data_us.wad");

  if (!wadFile) {
    throw new Error("dr1_data_us.wad not found in base_files.zip");
  }

  const wadBuffer = await wadFile.buffer();
  const tempWadPath = join(TEMP_DIR, "dr1_data_us.wad");

  await mkdir(TEMP_DIR, { recursive: true });
  await writeFile(tempWadPath, wadBuffer);

  return tempWadPath;
}

async function extractWadContents(wadPath: string): Promise<string> {
  console.log("Extracting WAD contents...");

  const extractDir = join(TEMP_DIR, "extracted");

  await mkdir(extractDir, { recursive: true });

  await execAsync(`node "${WAD_ARCHIVER_CLI}" extract "${wadPath}" "${extractDir}" --silent`, {
    maxBuffer: 50 * 1024 * 1024,
  });

  return extractDir;
}

async function decompileLinFiles(extractDir: string): Promise<string> {
  console.log("Decompiling .lin files...");

  const scriptDir = join(extractDir, "Dr1/data/us/script");

  if (!existsSync(scriptDir)) {
    throw new Error(`Script directory not found: ${scriptDir}`);
  }

  const result = await decompileDirectory(scriptDir);
  for (const failure of result.failed) {
    console.error(`  Failed: ${failure.file}: ${failure.error.message}`);
  }
  console.log(`Decompiled ${result.succeeded.length} .lin files`);

  return scriptDir;
}

async function copyLinscriptFiles(scriptDir: string): Promise<string[]> {
  console.log("Copying .linscript files to linscript-exploration...");

  await mkdir(LINSCRIPT_EXPLORATION_DIR, { recursive: true });

  const files = await readdir(scriptDir);
  const linscriptFiles = files.filter((f) => f.endsWith(".linscript"));

  let copiedCount = 0;
  for (const file of linscriptFiles) {
    const sourcePath = join(scriptDir, file);
    const destPath = join(LINSCRIPT_EXPLORATION_DIR, file);

    // Remove read-only flag if file exists
    try {
      await chmod(destPath, 0o644);
    } catch {
      // File doesn't exist yet, ignore
    }

    await copyFile(sourcePath, destPath);
    copiedCount++;
  }

  console.log(`Copied ${copiedCount} .linscript files`);
  return linscriptFiles;
}

async function makeFilesReadonly(files: string[]): Promise<void> {
  console.log("Making files read-only...");

  for (const file of files) {
    const filePath = join(LINSCRIPT_EXPLORATION_DIR, file);
    // chmod 0o444 = r--r--r-- (read-only for owner, group, and others)
    await chmod(filePath, 0o444);
  }

  console.log(`Set ${files.length} files to read-only`);
}

async function cleanup(): Promise<void> {
  console.log("Cleaning up temporary directory...");
  await rm(TEMP_DIR, { recursive: true, force: true });
}

async function main(): Promise<void> {
  try {
    console.log("Starting linscript extraction...\n");

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

    console.log("\n✓ Complete! Linscript files are in linscript-exploration/");
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);

    // Attempt cleanup on error
    try {
      await rm(TEMP_DIR, { recursive: true, force: true });
    } catch {}

    process.exit(1);
  }
}

main();
