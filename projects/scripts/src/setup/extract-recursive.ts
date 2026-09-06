#!/usr/bin/env node

import { exec } from "node:child_process";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { promisify } from "node:util";
import { extractPak } from "../formats/pak-archiver.ts";
import { errorMessage } from "../lib/errors.ts";

const execAsync = promisify(exec);

// ============================================================================
// WAD Archive Functions
// ============================================================================

// Copied from wad-archiver.ts
function readU32LE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

function readU64LE(buffer: Buffer, offset: number): bigint {
  return buffer.readBigUInt64LE(offset);
}

function readString(buffer: Buffer, offset: number): { value: string; nextOffset: number } {
  const length = buffer.readUInt32LE(offset);
  const value = buffer.toString("utf8", offset + 4, offset + 4 + length);
  return { value, nextOffset: offset + 4 + length };
}

class WadFileEntry {
  path: string;
  size: bigint;
  offset: bigint;

  constructor(path: string, size: bigint, offset: bigint) {
    this.path = path.replace(/\\/g, "/");
    this.size = size;
    this.offset = offset;
  }
}

class WadDirEntry {
  path: string;
  type: number;

  constructor(path: string, type: number) {
    this.path = path.replace(/\\/g, "/");
    this.type = type;
  }
}

class WadDir {
  path: string;
  entries: WadDirEntry[];

  constructor(path: string, entries?: WadDirEntry[]) {
    this.path = path.replace(/\\/g, "/");
    this.entries = entries || [];
  }
}

class Wad {
  version: [number, number];
  extraHeader: Buffer;
  files: WadFileEntry[];
  dirs: WadDir[];

  constructor(version: [number, number], extraHeader: Buffer, files: WadFileEntry[], dirs: WadDir[]) {
    this.version = version;
    this.extraHeader = extraHeader;
    this.files = files;
    this.dirs = dirs;
  }
}

interface ReadWadResult {
  wad: Wad;
  baseOffset: number;
  buffer: Buffer;
}

async function readWad(filePath: string): Promise<ReadWadResult> {
  const buffer = await readFile(filePath);
  let offset = 0;

  // Read magic
  const magic = buffer.toString("ascii", offset, offset + 4);
  offset += 4;

  if (magic !== "AGAR") {
    throw new Error("Not a WAD archive");
  }

  // Read version
  const versionMajor = readU32LE(buffer, offset);
  offset += 4;
  const versionMinor = readU32LE(buffer, offset);
  offset += 4;
  const version: [number, number] = [versionMajor, versionMinor];

  // Read extra header
  const extraHeaderSize = readU32LE(buffer, offset);
  offset += 4;
  const extraHeader = buffer.slice(offset, offset + extraHeaderSize);
  offset += extraHeaderSize;

  // Read files
  const fileCount = readU32LE(buffer, offset);
  offset += 4;
  const files: WadFileEntry[] = [];

  for (let i = 0; i < fileCount; i++) {
    const pathResult = readString(buffer, offset);
    offset = pathResult.nextOffset;

    const fileSize = readU64LE(buffer, offset);
    offset += 8;

    const fileOffset = readU64LE(buffer, offset);
    offset += 8;

    files.push(new WadFileEntry(pathResult.value, fileSize, fileOffset));
  }

  // Read directories
  const dirCount = readU32LE(buffer, offset);
  offset += 4;
  const dirs: WadDir[] = [];

  for (let i = 0; i < dirCount; i++) {
    const dirPathResult = readString(buffer, offset);
    offset = dirPathResult.nextOffset;

    const dirEntryCount = readU32LE(buffer, offset);
    offset += 4;
    const dirEntries: WadDirEntry[] = [];

    for (let j = 0; j < dirEntryCount; j++) {
      const entryPathResult = readString(buffer, offset);
      offset = entryPathResult.nextOffset;

      const entryType = buffer.readUInt8(offset);
      offset += 1;

      dirEntries.push(new WadDirEntry(entryPathResult.value, entryType));
    }

    dirs.push(new WadDir(dirPathResult.value, dirEntries));
  }

  const baseOffset = offset;
  return { wad: new Wad(version, extraHeader, files, dirs), baseOffset, buffer };
}

async function extractWad(wadPath: string, outputDir: string): Promise<string[]> {
  const { wad, baseOffset, buffer } = await readWad(wadPath);

  console.log(`Extracting ${wadPath} to ${outputDir}...`);

  for (const file of wad.files) {
    const fileOffset = Number(file.offset) + baseOffset;
    const fileSize = Number(file.size);
    const content = buffer.slice(fileOffset, fileOffset + fileSize);

    const outputPath = join(outputDir, file.path);
    console.log(`  Extracting: ${file.path}`);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }

  return wad.files.map((f) => join(outputDir, f.path));
}

// PAK extraction is now handled by pak-archiver.ts (imported above)

async function findAndExtractPaks(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      await findAndExtractPaks(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".pak")) {
      // Extract PAK files using pak-archiver's extractPak function
      const outputDir = fullPath.replace(/\.pak$/, "");
      await extractPak(fullPath, outputDir, false, 0);
      // Remove the .pak file after successful extraction (if it still exists -
      // extractPak may have renamed it if it wasn't actually a PAK)
      try {
        await unlink(fullPath);
        console.log(`  Removed: ${fullPath}`);
      } catch {
        // File was likely renamed by extractPak (e.g., TGA misnamed as .pak)
      }
    }
  }
}

// ============================================================================
// LIN Decompilation
// ============================================================================

async function collectDirsWithLinFiles(directory: string, results = new Set<string>()): Promise<Set<string>> {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectDirsWithLinFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith(".lin")) {
      results.add(directory);
    }
  }

  return results;
}

async function removeLinFiles(directory: string): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".lin")) {
      await unlink(join(directory, entry.name));
    }
  }
}

async function findAndDecompileLins(directory: string): Promise<void> {
  const dirsWithLins = await collectDirsWithLinFiles(directory);

  if (dirsWithLins.size === 0) {
    console.log("  No .lin files found");
    return;
  }

  console.log(`  Found ${dirsWithLins.size} directories with .lin files`);

  // Process each directory with lin-compiler's batch mode
  for (const dir of dirsWithLins) {
    try {
      console.log(`  Decompiling: ${dir}`);
      await execAsync(`node projects/lin-compiler/src/cli.ts -d "${dir}"`);
      // Remove .lin files after successful decompilation
      await removeLinFiles(dir);
    } catch (err) {
      console.log(`  Failed: ${dir}: ${errorMessage(err)}`);
    }
  }
}

// ============================================================================
// Main Function
// ============================================================================

function showUsage(): void {
  console.log(`Usage: extract-recursive.ts <input.wad>

Extracts a WAD file and recursively unpacks all PAK files found within.

Arguments:
  input.wad    Path to the WAD file to extract

Example:
  node extract-recursive.ts dr1_data.wad`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  const wadPath = args[0];

  try {
    // Check if file exists
    await stat(wadPath);
  } catch {
    console.error(`Error: File not found: ${wadPath}`);
    process.exit(1);
  }

  try {
    // Create output directory (same name as WAD, without extension)
    const wadBasename = basename(wadPath, extname(wadPath));
    const outputDir = join(dirname(wadPath), wadBasename);

    console.log(`Starting recursive extraction...`);
    console.log(`Input: ${wadPath}`);
    console.log(`Output: ${outputDir}`);
    console.log();

    // Step 1: Extract WAD
    await extractWad(wadPath, outputDir);

    console.log();
    console.log("WAD extraction complete. Searching for PAK files...");
    console.log();

    // Step 2: Find and recursively extract all PAK files
    await findAndExtractPaks(outputDir);

    console.log();
    console.log("PAK extraction complete. Decompiling LIN files...");
    console.log();

    // Step 3: Find and decompile all .lin files
    await findAndDecompileLins(outputDir);

    console.log();
    console.log("Recursive extraction complete!");
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
