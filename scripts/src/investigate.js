#!/usr/bin/env node

import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');
const LINSCRIPT_EXPLORATION_DIR = join(projectRoot, 'workspace', 'linscript-exploration');

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: pnpm run investigate <opcode> [filter1,filter2,...] [--sort=frequency|value]');
    console.error('   Use "x" for any value');
    console.error('   --sort defaults to "frequency"');
    console.error('Example: pnpm run investigate SetVar8 [x,x,x]');
    console.error('         pnpm run investigate SetVar8 [12,x,x]');
    console.error('         pnpm run investigate SetVar8 [x,x,x] --sort=value');
    process.exit(1);
  }

  const opcode = args[0];
  const filterStr = args[1];

  // Parse optional --sort parameter
  let sortMode = 'frequency'; // default
  const sortArg = args.find(arg => arg.startsWith('--sort='));
  if (sortArg) {
    const sortValue = sortArg.split('=')[1];
    if (sortValue !== 'frequency' && sortValue !== 'value') {
      console.error('--sort must be either "frequency" or "value"');
      process.exit(1);
    }
    sortMode = sortValue;
  }

  // Parse the filter array [x,x,x] or [12,x,x]
  const match = filterStr.match(/^\[(.+)\]$/);
  if (!match) {
    console.error('Filter must be in format [x,x,x] or [12,x,x]');
    process.exit(1);
  }

  const filters = match[1].split(',').map(f => f.trim());

  return { opcode, filters, sortMode };
}

function parseLinscriptFile(content, opcode, filters) {
  const lines = content.split('\n');
  const pattern = new RegExp(`^${opcode}\\((.+)\\)\\s*$`);
  const matches = [];
  const numArgs = filters.length;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const argsStr = match[1];
      const args = argsStr.split(',').map(arg => arg.trim());

      if (args.length === numArgs) {
        // Check if args match the filters
        let matchesFilter = true;
        for (let i = 0; i < numArgs; i++) {
          if (filters[i] !== 'x' && filters[i] !== args[i]) {
            matchesFilter = false;
            break;
          }
        }

        if (matchesFilter) {
          matches.push(args);
        }
      }
    }
  }

  return matches;
}

function analyzeArguments(allMatches, filters, sortMode) {
  const argStats = [];
  const numArgs = filters.length;

  for (let i = 0; i < numArgs; i++) {
    // Skip analysis for filtered (non-x) arguments
    if (filters[i] !== 'x') {
      argStats.push(null);
      continue;
    }

    const valueCounts = new Map();

    for (const match of allMatches) {
      const value = match[i];
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    }

    // Sort based on mode
    let sortedValues;
    if (sortMode === 'frequency') {
      // Sort by count (descending), then by value (ascending) for ties
      sortedValues = Array.from(valueCounts.entries())
        .sort((a, b) => {
          if (b[1] !== a[1]) {
            return b[1] - a[1]; // Sort by frequency descending
          }
          // For ties, sort by value ascending (numeric if possible)
          const aNum = parseFloat(a[0]);
          const bNum = parseFloat(b[0]);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a[0].localeCompare(b[0]);
        });
    } else { // sortMode === 'value'
      // Sort by value (numeric if possible, then alphabetic)
      sortedValues = Array.from(valueCounts.entries())
        .sort((a, b) => {
          const aNum = parseFloat(a[0]);
          const bNum = parseFloat(b[0]);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a[0].localeCompare(b[0]);
        });
    }

    argStats.push({
      values: sortedValues,
      totalUnique: valueCounts.size,
      totalOccurrences: allMatches.length
    });
  }

  return argStats;
}

async function investigate() {
  const { opcode, filters, sortMode } = parseArgs();

  const filterDisplay = filters.map((f, i) => f === 'x' ? 'x' : f).join(', ');
  console.log(`\nInvestigating opcode: ${opcode}(${filterDisplay})`);
  console.log(`Sort mode: ${sortMode}\n`);

  const files = await readdir(LINSCRIPT_EXPLORATION_DIR);
  const linscriptFiles = files.filter(f => f.endsWith('.linscript'));

  console.log(`Analyzing ${linscriptFiles.length} linscript files...\n`);

  let allMatches = [];

  for (const file of linscriptFiles) {
    const filePath = join(LINSCRIPT_EXPLORATION_DIR, file);
    const content = await readFile(filePath, 'utf8');
    const matches = parseLinscriptFile(content, opcode, filters);
    allMatches = allMatches.concat(matches);
  }

  if (allMatches.length === 0) {
    console.log(`No matches found for ${opcode}(${filterDisplay}).`);
    return;
  }

  console.log(`Found ${allMatches.length} total occurrences\n`);

  const argStats = analyzeArguments(allMatches, filters, sortMode);

  for (let i = 0; i < filters.length; i++) {
    if (argStats[i] === null) {
      // Skip filtered arguments
      continue;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Argument ${i + 1} (${argStats[i].totalUnique} unique values)`);
    console.log(`${'='.repeat(60)}\n`);

    const sortLabel = sortMode === 'frequency' ? 'sorted by frequency' : 'sorted by value';
    console.log(`All values (${sortLabel}):`);
    for (const [value, count] of argStats[i].values) {
      const percentage = ((count / argStats[i].totalOccurrences) * 100).toFixed(1);
      console.log(`  ${value.padEnd(20)} → ${count.toString().padStart(5)} occurrences (${percentage}%)`);
    }
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

investigate().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
