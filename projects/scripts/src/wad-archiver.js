#!/usr/bin/env node

import { readdir, stat, open, mkdir, readFile, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';

// Data Structures

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

// Buffer Reading Functions

function readU8(buffer, offset) {
  return buffer.readUInt8(offset);
}

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

// Buffer Writing Functions

function writeU8(buffer, value, offset) {
  buffer.writeUInt8(value, offset);
  return offset + 1;
}

function writeU32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value, offset);
  return offset + 4;
}

function writeU64LE(buffer, value, offset) {
  buffer.writeBigUInt64LE(BigInt(value), offset);
  return offset + 8;
}

function writeString(buffer, value, offset) {
  const strBuffer = Buffer.from(value, 'utf8');
  buffer.writeUInt32LE(strBuffer.length, offset);
  strBuffer.copy(buffer, offset + 4);
  return offset + 4 + strBuffer.length;
}

// Helper Functions

async function flatWalk(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files.sort();
}

function calculateStringSize(str) {
  return 4 + Buffer.byteLength(str, 'utf8');
}

// Core WAD Functions

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

      const entryType = readU8(buffer, offset);
      offset += 1;

      dirEntries.push(new WadDirEntry(entryPathResult.value, entryType));
    }

    dirs.push(new WadDir(dirPathResult.value, dirEntries));
  }

  const baseOffset = offset;
  return { wad: new Wad(version, extraHeader, files, dirs), baseOffset, buffer };
}

async function writeWad(wad, outputPath, inputFiles) {
  // Calculate header size
  let headerSize = 4 + 4 + 4 + 4 + wad.extraHeader.length; // Magic + version + extra header size + extra header
  headerSize += 4; // File count

  for (const file of wad.files) {
    headerSize += calculateStringSize(file.path);
    headerSize += 8; // size
    headerSize += 8; // offset
  }

  headerSize += 4; // Dir count

  for (const dir of wad.dirs) {
    headerSize += calculateStringSize(dir.path);
    headerSize += 4; // entry count
    for (const entry of dir.entries) {
      headerSize += calculateStringSize(entry.path);
      headerSize += 1; // type
    }
  }

  // Calculate total file size
  let totalSize = headerSize;
  for (const [physicalPath] of inputFiles) {
    const fileStats = await stat(physicalPath);
    totalSize += Number(fileStats.size);
  }

  // Create buffer and write header
  const headerBuffer = Buffer.alloc(headerSize);
  let offset = 0;

  // Write magic
  headerBuffer.write('AGAR', offset, 'ascii');
  offset += 4;

  // Write version
  offset = writeU32LE(headerBuffer, wad.version[0], offset);
  offset = writeU32LE(headerBuffer, wad.version[1], offset);

  // Write extra header
  offset = writeU32LE(headerBuffer, wad.extraHeader.length, offset);
  wad.extraHeader.copy(headerBuffer, offset);
  offset += wad.extraHeader.length;

  // Write file entries
  offset = writeU32LE(headerBuffer, wad.files.length, offset);
  for (const file of wad.files) {
    offset = writeString(headerBuffer, file.path, offset);
    offset = writeU64LE(headerBuffer, file.size, offset);
    offset = writeU64LE(headerBuffer, file.offset, offset);
  }

  // Write directory entries
  offset = writeU32LE(headerBuffer, wad.dirs.length, offset);
  for (const dir of wad.dirs) {
    offset = writeString(headerBuffer, dir.path, offset);
    offset = writeU32LE(headerBuffer, dir.entries.length, offset);
    for (const entry of dir.entries) {
      offset = writeString(headerBuffer, entry.path, offset);
      offset = writeU8(headerBuffer, entry.type, offset);
    }
  }

  // Write header to file
  await writeFile(outputPath, headerBuffer);

  // Append file contents
  const fh = await open(outputPath, 'a');
  try {
    for (const [physicalPath] of inputFiles) {
      const content = await readFile(physicalPath);
      await fh.write(content);
    }
  } finally {
    await fh.close();
  }
}

// Commands

async function listFiles(wadPath) {
  const { wad } = await readWad(wadPath);
  for (const file of wad.files) {
    console.log(file.path);
  }
}

async function extractFiles(wadPath, outputDir, silent = false) {
  const { wad, baseOffset, buffer } = await readWad(wadPath);

  for (const file of wad.files) {
    const fileOffset = Number(file.offset) + baseOffset;
    const fileSize = Number(file.size);
    const content = buffer.slice(fileOffset, fileOffset + fileSize);

    const outputPath = join(outputDir, file.path);
    if (!silent) {
      console.log('Saved', outputPath);
    }

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content);
  }
}

async function packFiles(inputDirs, outputPath, silent = false) {
  const version = [1, 1];
  const extraHeader = Buffer.alloc(0);
  const files = [];
  const dirs = [];
  let curOffset = 0;
  const inputFiles = [];

  // Collect all files from input directories
  for (const dir of inputDirs) {
    const physicalPaths = await flatWalk(dir);
    for (const physicalPath of physicalPaths) {
      const relativePath = relative(dir, physicalPath).replace(/\\/g, '/');

      // Check if file already added
      const exists = inputFiles.some(([, r]) => r === relativePath);
      if (!exists) {
        inputFiles.push([physicalPath, relativePath]);
      }
    }
  }

  // Create file entries
  for (const [physicalPath, relativePath] of inputFiles) {
    const fileStats = await stat(physicalPath);
    const entrySize = fileStats.size;
    const entryOffset = curOffset;
    curOffset += Number(entrySize);
    files.push(new WadFileEntry(relativePath, entrySize, entryOffset));
  }

  const wad = new Wad(version, extraHeader, files, dirs);

  await writeWad(wad, outputPath, inputFiles);

  if (!silent) {
    for (const [, relativePath] of inputFiles) {
      console.log('Adding', relativePath);
    }
  }
}

// CLI

function showUsage() {
  console.log(`Usage: wad-archiver.js [options] <command> [args...]

Commands:
  list <input.wad>                    List files in archive
  extract <input.wad> <output-dir>    Extract files from archive
  create <input-dir> <output.wad>     Create new archive

Options:
  -s, --silent                        Disable all output
  -h, --help                          Show this help`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  let silent = false;
  let filteredArgs = [];

  for (const arg of args) {
    if (arg === '-s' || arg === '--silent') {
      silent = true;
    } else {
      filteredArgs.push(arg);
    }
  }

  const command = filteredArgs[0];

  try {
    if (command === 'list') {
      if (filteredArgs.length < 2) {
        console.error('Error: list command requires input file');
        process.exit(1);
      }
      await listFiles(filteredArgs[1]);

    } else if (command === 'extract') {
      if (filteredArgs.length < 3) {
        console.error('Error: extract command requires input file and output directory');
        process.exit(1);
      }
      await extractFiles(filteredArgs[1], filteredArgs[2], silent);

    } else if (command === 'create') {
      if (filteredArgs.length < 3) {
        console.error('Error: create command requires input directory and output file');
        process.exit(1);
      }
      await packFiles([filteredArgs[1]], filteredArgs[2], silent);

    } else {
      console.error(`Error: Unknown command '${command}'`);
      showUsage();
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
