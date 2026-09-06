#!/usr/bin/env node

import { readdir, stat, open, mkdir, readFile, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { errorMessage } from '../lib/errors.ts';

// Data Structures

/** Sizes and offsets are read as bigint but built as number when packing. */
type U64 = number | bigint;

class WadFileEntry {
  path: string;
  size: U64;
  offset: U64;

  constructor(path: string, size: U64, offset: U64) {
    this.path = path.replace(/\\/g, '/');
    this.size = size;
    this.offset = offset;
  }
}

class WadDirEntry {
  path: string;
  type: number;

  constructor(path: string, type: number) {
    this.path = path.replace(/\\/g, '/');
    this.type = type;
  }
}

class WadDir {
  path: string;
  entries: WadDirEntry[];

  constructor(path: string, entries?: WadDirEntry[]) {
    this.path = path.replace(/\\/g, '/');
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

// Buffer Reading Functions

function readU8(buffer: Buffer, offset: number): number {
  return buffer.readUInt8(offset);
}

function readU32LE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

function readU64LE(buffer: Buffer, offset: number): bigint {
  return buffer.readBigUInt64LE(offset);
}

function readString(buffer: Buffer, offset: number): { value: string; nextOffset: number } {
  const length = buffer.readUInt32LE(offset);
  const value = buffer.toString('utf8', offset + 4, offset + 4 + length);
  return { value, nextOffset: offset + 4 + length };
}

// Buffer Writing Functions

function writeU8(buffer: Buffer, value: number, offset: number): number {
  buffer.writeUInt8(value, offset);
  return offset + 1;
}

function writeU32LE(buffer: Buffer, value: number, offset: number): number {
  buffer.writeUInt32LE(value, offset);
  return offset + 4;
}

function writeU64LE(buffer: Buffer, value: U64, offset: number): number {
  buffer.writeBigUInt64LE(BigInt(value), offset);
  return offset + 8;
}

function writeString(buffer: Buffer, value: string, offset: number): number {
  const strBuffer = Buffer.from(value, 'utf8');
  buffer.writeUInt32LE(strBuffer.length, offset);
  strBuffer.copy(buffer, offset + 4);
  return offset + 4 + strBuffer.length;
}

// Helper Functions

async function flatWalk(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
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

function calculateStringSize(str: string): number {
  return 4 + Buffer.byteLength(str, 'utf8');
}

// Core WAD Functions

interface ReadWadResult {
  wad: Wad;
  baseOffset: number;
  buffer: Buffer;
}

async function readWad(filePath: string): Promise<ReadWadResult> {
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

      const entryType = readU8(buffer, offset);
      offset += 1;

      dirEntries.push(new WadDirEntry(entryPathResult.value, entryType));
    }

    dirs.push(new WadDir(dirPathResult.value, dirEntries));
  }

  const baseOffset = offset;
  return { wad: new Wad(version, extraHeader, files, dirs), baseOffset, buffer };
}

/** A file to pack: its path on disk paired with its path inside the archive. */
type InputFile = [physicalPath: string, relativePath: string];

async function writeWad(wad: Wad, outputPath: string, inputFiles: InputFile[]): Promise<void> {
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

async function listFiles(wadPath: string): Promise<void> {
  const { wad } = await readWad(wadPath);
  for (const file of wad.files) {
    console.log(file.path);
  }
}

async function extractFiles(wadPath: string, outputDir: string, silent = false): Promise<void> {
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

async function packFiles(inputDirs: string[], outputPath: string, silent = false): Promise<void> {
  const version: [number, number] = [1, 1];
  const extraHeader = Buffer.alloc(0);
  const files: WadFileEntry[] = [];
  const dirs: WadDir[] = [];
  let curOffset = 0;
  const inputFiles: InputFile[] = [];

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

function showUsage(): void {
  console.log(`Usage: wad-archiver.ts [options] <command> [args...]

Commands:
  list <input.wad>                    List files in archive
  extract <input.wad> <output-dir>    Extract files from archive
  create <input-dir> <output.wad>     Create new archive

Options:
  -s, --silent                        Disable all output
  -h, --help                          Show this help`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  let silent = false;
  const filteredArgs: string[] = [];

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
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
