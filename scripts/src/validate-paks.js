#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

// ============================================================================
// Binary I/O Helpers
// ============================================================================

function readU32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

// ============================================================================
// PAK Reading (copied from pak-archiver.js)
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

async function readPak(filePath) {
  const buffer = await readFile(filePath);

  const fileCount = readU32LE(buffer, 0);

  const offsets = [];
  for (let i = 0; i < fileCount; i++) {
    offsets.push(readU32LE(buffer, 4 + i * 4));
  }

  offsets.push(buffer.length);

  const entries = [];
  for (let i = 0; i < fileCount; i++) {
    entries.push(new PakEntry(
      i,
      offsets[i],
      offsets[i + 1] - offsets[i]
    ));
  }

  return { pak: new Pak(entries), buffer };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return String(parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]).padStart(9, " ");
}

async function findPakFiles(directory) {
  const pakFiles = [];

  async function walk(currentDir) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      // Skip directories we can't read
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.pak')) {
        pakFiles.push(fullPath);
      }
    }
  }

  await walk(directory);
  return pakFiles.sort();
}

async function getDirectorySize(directory) {
  let totalSize = 0;

  async function walk(currentDir) {
    let entries;
    try {
      entries = await readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = await stat(fullPath);
          totalSize += Number(stats.size);
        } catch (err) {
          // Skip files we can't stat
        }
      }
    }
  }

  await walk(directory);
  return totalSize;
}

// ============================================================================
// Validation Logic
// ============================================================================

async function validatePakExtraction(pakPath, maxDeviation) {
  const extractedDir = pakPath.replace(/\.pak$/, '');

  // Check if extracted directory exists
  if (!existsSync(extractedDir)) {
    return {
      pakPath,
      status: 'missing',
      pakSize: 0,
      extractedSize: 0,
      deviation: 0
    };
  }

  // Read PAK to get file count and calculate header size
  const { pak } = await readPak(pakPath);
  const headerSize = 4 + (pak.entries.length * 4);

  // Get PAK file size (minus header, since extracted files don't include it)
  const pakStats = await stat(pakPath);
  const pakSize = Number(pakStats.size) - headerSize;

  // Get extracted directory size
  const extractedSize = await getDirectorySize(extractedDir);

  // Calculate deviation percentage and absolute difference
  const absoluteDiff = Math.abs(extractedSize - pakSize);
  const deviation = pakSize === 0 ? 0 : Math.abs((extractedSize - pakSize) / pakSize * 100);
  const isIncrease = extractedSize > pakSize;

  // Filter out: increases, absolute diff < 1KB, or within deviation threshold
  const shouldReport = !isIncrease && absoluteDiff >= 1024 && deviation > maxDeviation;

  return {
    pakPath,
    status: shouldReport ? 'deviation' : 'ok',
    pakSize,
    extractedSize,
    deviation,
    absoluteDiff,
    isIncrease
  };
}

// ============================================================================
// CLI & Main
// ============================================================================

function showUsage() {
  console.log(`Usage: pnpm validate-paks [options]

Description:
  Validates PAK file extractions by comparing the PAK file size with the
  extracted directory size. This helps identify extraction issues where
  files were not properly extracted or were incorrectly processed.

Options:
  --max-deviation=N    Maximum allowed size deviation percentage (default: 10)
  --path=PATH          Path to search for PAK files (default: workspace/all)
  -h, --help           Show this help

Examples:
  pnpm validate-paks
  pnpm validate-paks --max-deviation=5
  pnpm validate-paks --path=workspace/all/dr1_data`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  let maxDeviation = 10;
  let searchPath = join(projectRoot, 'workspace/all');

  for (const arg of args) {
    if (arg === '-h' || arg === '--help') {
      return { command: 'help' };
    } else if (arg.startsWith('--max-deviation=')) {
      maxDeviation = parseFloat(arg.split('=')[1]);
      if (isNaN(maxDeviation) || maxDeviation < 0) {
        throw new Error('Invalid max-deviation value');
      }
    } else if (arg.startsWith('--path=')) {
      searchPath = arg.split('=')[1];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { command: 'validate', maxDeviation, searchPath };
}

async function main() {
  try {
    const { command, maxDeviation, searchPath } = parseArgs();

    if (command === 'help') {
      showUsage();
      process.exit(0);
    }

    console.log(`Searching for PAK files in: ${searchPath}`);
    console.log(`Maximum allowed deviation: ${maxDeviation}%`);
    console.log();

    // Find all PAK files
    const pakFiles = await findPakFiles(searchPath);
    console.log(`Found ${pakFiles.length} PAK files. Validating...`);
    console.log();

    // Validate each PAK file
    const results = [];
    for (const pakPath of pakFiles) {
      const result = await validatePakExtraction(pakPath, maxDeviation);
      results.push(result);
    }

    // Count statistics
    const totalChecked = results.filter(r => r.status !== 'missing').length;
    const withinDeviation = results.filter(r => r.status === 'ok').length;
    const outsideDeviation = results.filter(r => r.status === 'deviation').length;
    const missing = results.filter(r => r.status === 'missing').length;

    // Print missing directories if any
    if (missing > 0) {
      console.log('MISSING EXTRACTED DIRECTORIES:');
      console.log('-'.repeat(80));

      const missingResults = results.filter(r => r.status === 'missing');
      for (const result of missingResults) {
        console.log(`${result.pakPath}`);
      }
      console.log();
    }

    // Print deviations (sorted by deviation percentage, descending)
    if (outsideDeviation > 0) {
      console.log('FILES OUTSIDE DEVIATION:');
      console.log('-'.repeat(80));

      const deviationResults = results
        .filter(r => r.status === 'deviation')
        .sort((a, b) => b.deviation - a.deviation);

      for (const result of deviationResults) {
        console.log(`(${result.deviation.toFixed(1)}% smaller) [${formatBytes(result.pakSize)} -> ${formatBytes(result.extractedSize)}] ${result.pakPath} `);
      }
    }

    // Print summary
    console.log('='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`${results.length} PAK files found`);
    console.log(`${totalChecked} PAK files checked against extracted directories`);
    console.log(`${withinDeviation} files were found to be within the allowed deviation (${maxDeviation}%)`);
    console.log(`${outsideDeviation} files were found outside of the deviation`);
    if (missing > 0) {
      console.log(`${missing} extracted directories not found (not yet extracted)`);
    }
    console.log();

    // Exit with error code if there are issues
    if (outsideDeviation > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
