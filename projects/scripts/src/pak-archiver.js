#!/usr/bin/env node

import { readFile, writeFile, readdir, stat, mkdir, rename, rm } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { decompress as decompressSpike, isCompressed as isSpikeCompressed } from './spike-chunsoft-decompress.js';
import { convertGXT } from './gxt-to-png.js';

const execAsync = promisify(exec);

// File type colors
const typeColor = {
  pak: chalk.white,
  gmo: chalk.yellow,
  tga: chalk.magenta,
  lin: chalk.cyan,
  txt: chalk.gray,
  gxt: chalk.green,
  spft: chalk.blue,
  llfs: chalk.red,
};

// ============================================================================
// SECTION 1: Binary I/O Helpers
// ============================================================================

function readU32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function writeU32LE(buffer, value, offset) {
  buffer.writeUInt32LE(value, offset);
  return offset + 4;
}

// ============================================================================
// SECTION 2: File Type Detection
// ============================================================================

class FileTypeChecker {
  static isGMO(data) {
    if (data.length < 12) return false;
    // GMO files start with "OMG.00.1PSP\0" (12 bytes)
    const gmoHeader = Buffer.from('4F4D472E30302E31505350', 'hex'); // "OMG.00.1PSP"
    return data.slice(0, 11).equals(gmoHeader);
  }

  static isPAK(data) {
    if (data.length < 4) return false;

    const fileCount = readU32LE(data, 0);

    // Validate file count
    if (fileCount === null || fileCount > 1000 || fileCount === 0) return false;

    // Need at least enough data for header
    const offsetSize = 4 + fileCount * 4;
    if (data.length < offsetSize) return false;

    // Read offsets and validate they're sequential
    const offsets = [];
    for (let i = 0; i < fileCount; i++) {
      const offset = readU32LE(data, 4 + i * 4);
      if (offset === null) return false;
      offsets.push(offset);
    }

    // Check if offsets are sorted
    for (let i = 1; i < offsets.length; i++) {
      if (offsets[i] < offsets[i - 1]) return false;
    }

    // First offset must be at least offsetSize (can't point before end of header)
    const firstOffset = offsets[0];
    if (firstOffset < offsetSize) return false;

    // First offset should be within 12 bytes of offsetSize
    if (firstOffset < offsetSize || firstOffset > offsetSize + 12) return false;

    // Last offset must be less than file size
    const lastOffset = offsets[offsets.length - 1];
    if (lastOffset >= data.length) return false;

    // Additional validation: check entry sizes to avoid false positives
    // (e.g., string tables that look like PAK headers)
    offsets.push(data.length);
    const sizes = [];
    for (let i = 0; i < fileCount; i++) {
      sizes.push(offsets[i + 1] - offsets[i]);
    }

    // Check if entries look like UTF-16 text (start with BOM FF FE)
    // If so, it's a valid text PAK even with small entries
    let utf16Entries = 0;
    for (let i = 0; i < fileCount; i++) {
      const entryStart = offsets[i];
      if (entryStart + 2 <= data.length && data[entryStart] === 0xFF && data[entryStart + 1] === 0xFE) {
        utf16Entries++;
      }
    }
    const isTextPak = utf16Entries > fileCount * 0.5;

    // Skip size checks for text PAKs - they legitimately have small entries
    if (!isTextPak) {
      // Reject if most entries are tiny (likely a string table, not a PAK)
      const tinyEntries = sizes.filter(s => s < 50).length;
      if (tinyEntries > fileCount * 0.8) return false;

      // Reject if average entry size is suspiciously small
      const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      if (avgSize < 30) return false;
    }

    return true;
  }

  static isSPFT(data) {
    if (data.length < 4) return false;
    // SPFT files start with "tFpS" (little-endian "SpFt" = Sprite Font)
    return data[0] === 0x74 && data[1] === 0x46 && data[2] === 0x70 && data[3] === 0x53;
  }

  static isLLFS(data) {
    if (data.length < 4) return false;
    // LLFS files start with "LLFS" magic
    return data[0] === 0x4C && data[1] === 0x4C && data[2] === 0x46 && data[3] === 0x53;
  }

  static isUTF16Text(data) {
    if (data.length < 2) return false;
    // UTF-16LE BOM
    return data[0] === 0xFF && data[1] === 0xFE;
  }

  static isLIN(data) {
    if (data.length < 20) return false;

    // Script type: 01 (Textless) or 02 (Text)
    const scriptType = data.readUInt32LE(0);
    if (scriptType !== 1 && scriptType !== 2) return false;

    // Header size (usually 0x10, but could vary)
    const headerSize = data.readUInt32LE(4);
    if (headerSize < 8 || headerSize > 0x100) return false;

    // Check that we have enough data to read the first opcode
    if (data.length <= headerSize) return false;

    // First byte after header should be 0x70 (opcode marker)
    if (data[headerSize] !== 0x70) return false;

    return true;
  }

  static isTGA(data) {
    if (data.length < 18) return false;

    // ID length check (byte 0)
    const idLength = data[0];
    if (idLength > 255) return false;

    // Color map type check (byte 1)
    const colorMapType = data[1];
    if (colorMapType !== 0 && colorMapType !== 1) return false;

    // Image type check (byte 2)
    const imageType = data[2];
    const validImageTypes = [0, 1, 2, 3, 9, 10];
    if (!validImageTypes.includes(imageType)) return false;

    // Color map spec (bytes 3-7)
    const firstEntryIndex = data.readUInt16LE(3);
    if (firstEntryIndex > data.length) return false;

    // Image spec starts at byte 8
    // Width at bytes 12-13, height at bytes 14-15
    const width = data.readUInt16LE(12);
    if (width <= 0 || width >= 8192) return false;

    const height = data.readUInt16LE(14);
    if (height <= 0 || height >= 8192) return false;

    return true;
  }

  static isGXT(data) {
    if (data.length < 12) return false;
    // GXT files can be raw (magic "GXT\0") or compressed (magic FC AA 55 A7)

    // Raw GXT: starts with "GXT\0"
    if (data[0] === 0x47 && data[1] === 0x58 && data[2] === 0x54 && data[3] === 0x00) {
      return true;
    }

    // Compressed GXT (SpikeDRVita): starts with FC AA 55 A7
    if (data[0] === 0xFC && data[1] === 0xAA && data[2] === 0x55 && data[3] === 0xA7) {
      return true;
    }

    return false;
  }

  static detectType(data) {
    if (FileTypeChecker.isGMO(data)) return 'gmo';
    if (FileTypeChecker.isSPFT(data)) return 'spft';
    if (FileTypeChecker.isLLFS(data)) return 'llfs';
    if (FileTypeChecker.isGXT(data)) return 'gxt';
    if (FileTypeChecker.isUTF16Text(data)) return 'txt';
    if (FileTypeChecker.isLIN(data)) return 'lin';
    if (FileTypeChecker.isTGA(data)) return 'tga';
    if (FileTypeChecker.isPAK(data)) return 'pak';
    return null;
  }
}

// ============================================================================
// SECTION 3: PAK Data Structures
// ============================================================================

class PakEntry {
  constructor(index, offset, size) {
    this.index = index;
    this.offset = offset;
    this.size = size;
  }
}

class Pak {
  constructor(entries) {
    this.entries = entries;
  }
}

// ============================================================================
// SECTION 4: PAK Core Operations
// ============================================================================

async function readPak(filePath) {
  const buffer = await readFile(filePath);

  const fileCount = readU32LE(buffer, 0);

  // Read offsets (these are absolute offsets from start of file)
  const offsets = [];
  for (let i = 0; i < fileCount; i++) {
    offsets.push(readU32LE(buffer, 4 + i * 4));
  }

  // Add file end as last offset for size calculation
  offsets.push(buffer.length);

  // Build entries - offsets are already absolute
  const entries = [];
  for (let i = 0; i < fileCount; i++) {
    entries.push(new PakEntry(
      i,
      offsets[i],  // Use absolute offset directly
      offsets[i + 1] - offsets[i]
    ));
  }

  return { pak: new Pak(entries), buffer };
}

async function writePak(pak, outputPath, inputFiles) {
  // Calculate header size
  const headerSize = 4 + pak.entries.length * 4;

  // Calculate total size
  let totalSize = headerSize;
  for (const [filePath] of inputFiles) {
    const fileStats = await stat(filePath);
    totalSize += Number(fileStats.size);
  }

  // Create header buffer
  const headerBuffer = Buffer.alloc(headerSize);
  let offset = 0;

  // Write file count
  offset = writeU32LE(headerBuffer, pak.entries.length, offset);

  // Write offsets (these are absolute offsets)
  for (const entry of pak.entries) {
    offset = writeU32LE(headerBuffer, entry.offset, offset);
  }

  // Write header
  await writeFile(outputPath, headerBuffer);

  // Append file contents
  for (const [filePath] of inputFiles) {
    const content = await readFile(filePath);
    await writeFile(outputPath, content, { flag: 'a' });
  }
}

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

// Map of known extensions to file types
const EXTENSION_TO_TYPE = {
  '.pak': 'pak',
  '.gmo': 'gmo',
  '.tga': 'tga',
  '.lin': 'lin',
  '.txt': 'txt',
  '.gxt': 'gxt',
  '.spft': 'spft',
  '.llfs': 'llfs',
};

function getTypeFromExtension(filePath) {
  const lowerPath = filePath.toLowerCase();
  for (const [ext, type] of Object.entries(EXTENSION_TO_TYPE)) {
    if (lowerPath.endsWith(ext)) {
      return type;
    }
  }
  return null;
}

async function extractPak(inputPath, outputPath, silent = false, depth = 0) {
  const indent = '    '.repeat(depth);
  const printIndented = (msg) => {
    if (!silent) console.log(`${indent}${msg}`);
  };

  let data;
  try {
    data = await readFile(inputPath);
  } catch (err) {
    // File doesn't exist or can't be read - skip silently
    return;
  }

  // If file already has a known extension, trust it; otherwise auto-detect
  const fileType = getTypeFromExtension(inputPath) || FileTypeChecker.detectType(data);

  switch (fileType) {
    case 'pak':
      printIndented(`Processing ${inputPath} as ${typeColor.pak('PAK')}`);

      // Ensure has .pak extension
      let pakPath = inputPath;
      if (!inputPath.endsWith('.pak')) {
        pakPath = inputPath + '.pak';
        await rename(inputPath, pakPath);
      }

      const { pak, buffer } = await readPak(pakPath);
      // Extract to a directory based on the pak path (without .pak extension)
      const pakOutputDir = pakPath.replace(/\.pak$/, '');

      // Remove existing directory if it exists (from a previous run)
      try {
        const existingStat = await stat(pakOutputDir);
        if (existingStat.isDirectory()) {
          await rm(pakOutputDir, { recursive: true });
        }
      } catch (err) {
        // Doesn't exist, that's fine
      }

      await mkdir(pakOutputDir, { recursive: true });

      for (const entry of pak.entries) {
        const content = buffer.slice(entry.offset, entry.offset + entry.size);
        const entryPath = join(pakOutputDir, String(entry.index).padStart(4, '0'));
        await writeFile(entryPath, content);

        // Recurse - output path is the entry path (will become a directory if it's a PAK)
        await extractPak(entryPath, entryPath, silent, depth + 1);
      }
      break;

    case 'gmo':
      printIndented(`Processing ${inputPath} as ${typeColor.gmo('GMO')}`);
      const gmoPath = inputPath.endsWith('.gmo') ? inputPath : inputPath + '.gmo';
      if (inputPath !== gmoPath) {
        await rename(inputPath, gmoPath);
      }
      await linkGMOName(gmoPath);
      break;

    case 'tga':
      printIndented(`Processing ${inputPath} as ${typeColor.tga('TGA')}`);
      const tgaPath = inputPath.endsWith('.tga') ? inputPath : inputPath + '.tga';
      if (inputPath !== tgaPath) {
        await rename(inputPath, tgaPath);
      }
      break;

    case 'spft':
      printIndented(`Processing ${inputPath} as ${typeColor.spft('SPFT')}`);
      const spftPath = inputPath.endsWith('.spft') ? inputPath : inputPath + '.spft';
      if (inputPath !== spftPath) {
        await rename(inputPath, spftPath);
      }
      break;

    case 'llfs':
      printIndented(`Processing ${inputPath} as ${typeColor.llfs('LLFS')}`);
      const llfsPath = inputPath.endsWith('.llfs') ? inputPath : inputPath + '.llfs';
      if (inputPath !== llfsPath) {
        await rename(inputPath, llfsPath);
      }
      break;

    case 'gxt':
      printIndented(`Processing ${inputPath} as ${typeColor.gxt('GXT')}`);
      let gxtPath = inputPath.endsWith('.gxt') ? inputPath : inputPath + '.gxt';
      if (inputPath !== gxtPath) {
        await rename(inputPath, gxtPath);
      }

      try {
        // Check if compressed (FC AA 55 A7 magic)
        if (isSpikeCompressed(data)) {
          printIndented(`  Decompressing Spike Chunsoft compressed GXT...`);
          const decompressed = decompressSpike(data);
          await writeFile(gxtPath, decompressed);
        }

        // Convert to PNG
        const pngOutputDir = dirname(gxtPath);
        printIndented(`  Converting to PNG...`);
        const pngFiles = await convertGXT(gxtPath, pngOutputDir, true);  // silent mode
        for (const pngFile of pngFiles) {
          printIndented(`  Created: ${basename(pngFile)}`);
        }
      } catch (err) {
        printIndented(`  Failed to convert GXT: ${err.message}`);
      }
      break;

    case 'txt':
      printIndented(`Processing ${inputPath} as ${typeColor.txt('TXT')}`);
      const txtPath = inputPath.endsWith('.txt') ? inputPath : inputPath + '.txt';
      if (inputPath !== txtPath) {
        await rename(inputPath, txtPath);
      }
      break;

    case 'lin':
      printIndented(`Processing ${inputPath} as ${typeColor.lin('LIN')}`);
      const linPath = inputPath.endsWith('.lin') ? inputPath : inputPath + '.lin';
      if (inputPath !== linPath) {
        await rename(inputPath, linPath);
      }
      break;

    default:
      printIndented(`Processing ${inputPath} as ${chalk.dim('UNKNOWN')}`);
      break;
  }
}

// ============================================================================
// SECTION 5: GMO Naming Logic
// ============================================================================

async function linkGMOName(gmoPath) {
  try {
    const parentFolder = dirname(gmoPath);
    const gmoBasename = basename(gmoPath, '.gmo');
    const fileIndex = parseInt(gmoBasename.split('.')[0], 10);
    const gmoNameIndex = fileIndex - 3;

    // unpacked_folder_suffix is empty in Python, so just "0000"
    const unpackedFolder = join(parentFolder, '0000');
    const unpackedFile = join(unpackedFolder, String(gmoNameIndex).padStart(4, '0'));

    const content = await readFile(unpackedFile);
    const name = content.toString('utf8').split('\0')[0];

    const newGmoPath = join(parentFolder, `${gmoBasename}.${name}.gmo`);
    await rename(gmoPath, newGmoPath);
    console.log(`Renamed to: ${newGmoPath}`);
  } catch (err) {
    // Silently fail if companion file not found
  }
}

// ============================================================================
// SECTION 6: Commands
// ============================================================================

const BOM = Buffer.from([0xFF, 0xFE]); // UTF-16 LE BOM

function isUTF16Text(data) {
  return data.length >= 2 && data[0] === 0xFF && data[1] === 0xFE;
}

async function listFiles(inputPaths) {
  for (const inputPath of inputPaths) {
    console.log(inputPath);

    const { pak, buffer } = await readPak(inputPath);

    // Calculate padding
    const indexPad = Math.ceil(Math.log10(pak.entries.length));
    const maxSize = Math.max(...pak.entries.map(e => e.size));
    const sizePad = Math.ceil(Math.log10(maxSize));

    for (const entry of pak.entries) {
      const content = buffer.slice(entry.offset, entry.offset + entry.size);

      let contentText;
      if (isUTF16Text(content)) {
        contentText = content.toString('utf16le');
      } else {
        contentText = '/BINARY CONTENT/';
      }

      const indexStr = String(entry.index).padStart(indexPad, ' ');
      const sizeStr = String(entry.size).padStart(sizePad, '0');
      console.log(`${indexStr} (${sizeStr}) ${contentText}`);
    }
  }
}

async function extractFiles(inputPath, outputPath, silent) {
  await extractPak(inputPath, outputPath, silent);
}

async function packFiles(inputDirs, outputPath, silent) {
  const inputFiles = [];

  for (const dir of inputDirs) {
    const files = await flatWalk(dir);
    for (const filePath of files) {
      if (!inputFiles.some(([p]) => p === filePath)) {
        inputFiles.push([filePath, filePath]);
      }
    }
  }

  // Build entries
  const headerSize = 4 + inputFiles.length * 4;
  let curOffset = headerSize;
  const entries = [];

  for (const [filePath] of inputFiles) {
    const fileStats = await stat(filePath);
    const entryIndex = parseInt(basename(filePath), 10);
    const entrySize = Number(fileStats.size);
    entries.push(new PakEntry(entryIndex, curOffset, entrySize));
    curOffset += entrySize;
  }

  const pak = new Pak(entries);
  await writePak(pak, outputPath, inputFiles);

  if (!silent) {
    for (const [filePath] of inputFiles) {
      console.log('Adding', filePath);
    }
  }
}

async function replaceTextEntry(inputPath, index, content) {
  const { pak, buffer } = await readPak(inputPath);

  // Read all entry contents
  for (const entry of pak.entries) {
    entry.content = buffer.slice(entry.offset, entry.offset + entry.size);
  }

  // Find and replace target entry
  const entryIndex = parseInt(index, 10);
  const entry = pak.entries[entryIndex];

  if (!isUTF16Text(entry.content)) {
    throw new Error('Chosen entry contains binary data! Use extract/create instead.');
  }

  // Encode new content with BOM
  entry.content = Buffer.concat([BOM, Buffer.from(content, 'utf16le')]);

  // Recalculate offsets
  const headerSize = 4 + pak.entries.length * 4;
  let curOffset = headerSize;
  for (const entry of pak.entries) {
    entry.offset = curOffset;
    entry.size = entry.content.length;
    curOffset += entry.size;
  }

  // Write new PAK
  const headerBuffer = Buffer.alloc(headerSize);
  let offset = 0;
  offset = writeU32LE(headerBuffer, pak.entries.length, offset);
  for (const entry of pak.entries) {
    offset = writeU32LE(headerBuffer, entry.offset - headerSize, offset);
  }

  await writeFile(inputPath, headerBuffer);

  // Append contents
  for (const entry of pak.entries) {
    await writeFile(inputPath, entry.content, { flag: 'a' });
  }
}

// ============================================================================
// SECTION 7: CLI & Main
// ============================================================================

function showUsage() {
  console.log(`Usage: pak-archiver.js [options] <command> [args...]

Commands:
  list <input.pak> [...]              List files in archive(s)
  extract <input.pak> <output-dir>    Extract files from archive
  create <input-dir> <output.pak>     Create new archive
  replace <input.pak> <index> <text>  Replace text entry in archive

Options:
  -s, --silent                        Suppress output
  -h, --help                          Show this help

Examples:
  node pak-archiver.js list archive.pak
  node pak-archiver.js extract archive.pak output/
  node pak-archiver.js create input/ archive.pak
  node pak-archiver.js replace archive.pak 5 "New text"`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let silent = false;
  const filteredArgs = [];

  for (const arg of args) {
    if (arg === '-s' || arg === '--silent') {
      silent = true;
    } else if (arg === '-h' || arg === '--help') {
      return { command: 'help', args: [], silent };
    } else {
      filteredArgs.push(arg);
    }
  }

  if (filteredArgs.length === 0) {
    return { command: 'help', args: [], silent };
  }

  const command = filteredArgs[0];
  const commandArgs = filteredArgs.slice(1);

  return { command, args: commandArgs, silent };
}

async function main() {
  try {
    const { command, args, silent } = parseArgs();

    if (command === 'help') {
      showUsage();
      process.exit(0);
    }

    if (command === 'list') {
      if (args.length === 0) {
        console.error('Error: list command requires at least one input file');
        process.exit(1);
      }
      await listFiles(args);

    } else if (command === 'extract') {
      if (args.length < 2) {
        console.error('Error: extract command requires input file and output directory');
        process.exit(1);
      }
      await extractFiles(args[0], args[1], silent);

    } else if (command === 'create') {
      if (args.length < 2) {
        console.error('Error: create command requires input directory and output file');
        process.exit(1);
      }
      await packFiles([args[0]], args[1], silent);

    } else if (command === 'replace') {
      if (args.length < 3) {
        console.error('Error: replace command requires input file, index, and content');
        process.exit(1);
      }
      await replaceTextEntry(args[0], args[1], args[2]);

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

// Export functions for use by other scripts
export { FileTypeChecker, extractPak, linkGMOName, readPak };

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
