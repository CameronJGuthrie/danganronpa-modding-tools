#!/usr/bin/env node

import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { basename, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { extractPak } from './pak-archiver.js';

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// WAD Archive Functions
// ============================================================================

// Copied from wad-archiver.js
function readU32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readU64LE(buffer, offset) {
  return buffer.readBigUInt64LE(offset);
}

function readString(buffer, offset) {
  const length = buffer.readUInt32LE(offset);
  const value = buffer.toString('utf8', offset + 4, offset + 4 + length);
  return { value, nextOffset: offset + 4 + length };
}

class WadFileEntry {
  constructor(path, size, offset) {
    this.path = path.replace(/\\/g, '/');
    this.size = size;
    this.offset = offset;
  }
}

class WadDirEntry {
  constructor(path, type) {
    this.path = path.replace(/\\/g, '/');
    this.type = type;
  }
}

class WadDir {
  constructor(path, entries) {
    this.path = path.replace(/\\/g, '/');
    this.entries = entries || [];
  }
}

class Wad {
  constructor(version, extraHeader, files, dirs) {
    this.version = version;
    this.extraHeader = extraHeader;
    this.files = files;
    this.dirs = dirs;
  }
}

async function readWad(filePath) {
  const buffer = await readFile(filePath);
  let offset = 0;

  // Read magic
  const magic = buffer.toString('ascii', offset, offset + 4);
  offset += 4;

  if (magic !== 'AGAR') {
    throw new Error('Not a WAD archive');
  }

  // Read version
  const versionMajor = readU32LE(buffer, offset);
  offset += 4;
  const versionMinor = readU32LE(buffer, offset);
  offset += 4;
  const version = [versionMajor, versionMinor];

  // Read extra header
  const extraHeaderSize = readU32LE(buffer, offset);
  offset += 4;
  const extraHeader = buffer.slice(offset, offset + extraHeaderSize);
  offset += extraHeaderSize;

  // Read files
  const fileCount = readU32LE(buffer, offset);
  offset += 4;
  const files = [];

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
  const dirs = [];

  for (let i = 0; i < dirCount; i++) {
    const dirPathResult = readString(buffer, offset);
    offset = dirPathResult.nextOffset;

    const dirEntryCount = readU32LE(buffer, offset);
    offset += 4;
    const dirEntries = [];

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

async function extractWad(wadPath, outputDir) {
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

  return wad.files.map(f => join(outputDir, f.path));
}

// PAK extraction is now handled by pak-archiver.js (imported above)

async function findAndExtractPaks(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      await findAndExtractPaks(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.pak')) {
      // Extract PAK files using pak-archiver's extractPak function
      const outputDir = fullPath.replace(/\.pak$/, '');
      await extractPak(fullPath, outputDir, false, 0);
      // Remove the .pak file after successful extraction (if it still exists -
      // extractPak may have renamed it if it wasn't actually a PAK)
      try {
        await unlink(fullPath);
        console.log(`  Removed: ${fullPath}`);
      } catch (err) {
        // File was likely renamed by extractPak (e.g., TGA misnamed as .pak)
      }
    }
  }
}

// ============================================================================
// LIN Decompilation
// ============================================================================

async function collectDirsWithLinFiles(directory, results = new Set()) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectDirsWithLinFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.lin')) {
      results.add(directory);
    }
  }

  return results;
}

async function removeLinFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.lin')) {
      await unlink(join(directory, entry.name));
    }
  }
}

async function findAndDecompileLins(directory) {
  const dirsWithLins = await collectDirsWithLinFiles(directory);

  if (dirsWithLins.size === 0) {
    console.log('  No .lin files found');
    return;
  }

  console.log(`  Found ${dirsWithLins.size} directories with .lin files`);

  // Process each directory with lin-compiler's batch mode
  for (const dir of dirsWithLins) {
    try {
      console.log(`  Decompiling: ${dir}`);
      await execAsync(`dotnet lin-compiler/lin_compiler/bin/Release/net8.0/lin_compiler.dll -d "${dir}"`);
      // Remove .lin files after successful decompilation
      await removeLinFiles(dir);
    } catch (err) {
      console.log(`  Failed: ${dir}: ${err.message}`);
    }
  }
}

// ============================================================================
// Main Function
// ============================================================================

function showUsage() {
  console.log(`Usage: extract-recursive.js <input.wad>

Extracts a WAD file and recursively unpacks all PAK files found within.

Arguments:
  input.wad    Path to the WAD file to extract

Example:
  node extract-recursive.js dr1_data.wad`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  const wadPath = args[0];

  try {
    // Check if file exists
    await stat(wadPath);
  } catch (err) {
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
    console.log('WAD extraction complete. Searching for PAK files...');
    console.log();

    // Step 2: Find and recursively extract all PAK files
    await findAndExtractPaks(outputDir);

    console.log();
    console.log('PAK extraction complete. Decompiling LIN files...');
    console.log();

    // Step 3: Find and decompile all .lin files
    await findAndDecompileLins(outputDir);

    console.log();
    console.log('Recursive extraction complete!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
