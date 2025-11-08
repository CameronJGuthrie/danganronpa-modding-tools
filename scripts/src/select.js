#!/usr/bin/env node

import { existsSync } from 'fs';
import { mkdir, copyFile } from 'fs/promises';
import { join, dirname, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');

const MODDED_DIR = join(projectRoot, 'workspace', 'modded', 'dr1_data_us');
const MOD_DIR = join(projectRoot, 'workspace', 'mod', 'dr1_data_us');
const EXPLORATION_DIR = join(projectRoot, 'workspace', 'linscript-exploration');
const LIN_COMPILER_PATH = join(projectRoot, 'lin-compiler', 'lin_compiler', 'bin', 'Release', 'net8.0', 'lin_compiler.dll');

function showUsage() {
  console.log(`Usage: pnpm select <filepath>

Two modes:
1. .lin file: Decompiles from workspace/modded/ and places the .linscript in workspace/mod/
2. .linscript file: Copies from workspace/linscript-exploration/ to workspace/mod/ with proper structure

Examples:
  pnpm select e01_004_135.lin
  pnpm select Dr1/data/us/script/e01_004_135.lin
  pnpm select workspace/modded/dr1_data_us/Dr1/data/us/script/e01_004_135.lin

  pnpm select e01_004_135.linscript
  pnpm select workspace/linscript-exploration/e01_004_135.linscript`);
}

function resolveLinFilePath(inputPath) {
  // If it's an absolute path
  if (inputPath.startsWith('/')) {
    if (!inputPath.startsWith(MODDED_DIR)) {
      throw new Error(`File must be within ${MODDED_DIR}`);
    }
    return inputPath;
  }

  // If it's a relative path from project root
  if (inputPath.startsWith('workspace/modded/')) {
    return join(projectRoot, inputPath);
  }

  // If it's a path relative to dr1_data_us
  if (inputPath.startsWith('Dr1/')) {
    return join(MODDED_DIR, inputPath);
  }

  // If it's just a filename, assume it's in the script directory
  if (!inputPath.includes('/')) {
    return join(MODDED_DIR, 'Dr1/data/us/script', inputPath);
  }

  // Otherwise, try treating it as relative to MODDED_DIR
  return join(MODDED_DIR, inputPath);
}

function resolveLinscriptFilePath(inputPath) {
  // If it's an absolute path
  if (inputPath.startsWith('/')) {
    if (!inputPath.startsWith(EXPLORATION_DIR)) {
      throw new Error(`File must be within ${EXPLORATION_DIR}`);
    }
    return inputPath;
  }

  // If it's a relative path from project root
  if (inputPath.startsWith('workspace/linscript-exploration/')) {
    return join(projectRoot, inputPath);
  }

  // If it's just a filename, assume it's in the exploration directory
  if (!inputPath.includes('/')) {
    return join(EXPLORATION_DIR, inputPath);
  }

  // Otherwise, try treating it as relative to EXPLORATION_DIR
  return join(EXPLORATION_DIR, inputPath);
}

async function handleLinFile(inputPath) {
  // Resolve the input path
  const sourceFile = resolveLinFilePath(inputPath);

  // Check if file exists
  if (!existsSync(sourceFile)) {
    console.error(`Error: File not found: ${sourceFile}`);
    process.exit(1);
  }

  // Check if lin_compiler exists
  if (!existsSync(LIN_COMPILER_PATH)) {
    console.error('Error: lin_compiler not found. Please build it first with: pnpm lin-compiler:build');
    process.exit(1);
  }

  // Calculate the relative path from MODDED_DIR
  const relativePath = relative(MODDED_DIR, sourceFile);

  // Calculate the output path in MOD_DIR
  const outputBase = basename(sourceFile, '.lin');
  const outputFile = join(MOD_DIR, dirname(relativePath), `${outputBase}.linscript`);

  console.log(`Selecting: ${relativePath}`);
  console.log(`Output:    ${relative(projectRoot, outputFile)}`);

  // Create output directory
  await mkdir(dirname(outputFile), { recursive: true });

  // Copy the .lin file to a temp location for decompilation
  const tempDir = dirname(outputFile);
  const tempLinFile = join(tempDir, basename(sourceFile));
  await copyFile(sourceFile, tempLinFile);

  // Decompile the .lin file
  console.log('\nDecompiling...');
  const { stdout, stderr } = await execAsync(
    `dotnet "${LIN_COMPILER_PATH}" -d "${tempLinFile}" "${outputFile}"`,
    { maxBuffer: 10 * 1024 * 1024 }
  );

  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);

  // Remove the temporary .lin file
  await execAsync(`rm "${tempLinFile}"`);

  console.log(`\n✓ Created: ${relative(projectRoot, outputFile)}`);

  // Open the file in VSCode
  try {
    await execAsync(`code "${outputFile}"`);
  } catch (error) {
    // Silently fail if 'code' command is not available
  }
}

async function handleLinscriptFile(inputPath) {
  // Resolve the input path
  const sourceFile = resolveLinscriptFilePath(inputPath);

  // Check if file exists
  if (!existsSync(sourceFile)) {
    console.error(`Error: File not found: ${sourceFile}`);
    process.exit(1);
  }

  // Extract the base filename (e.g., e01_004_135 from e01_004_135.linscript)
  const baseFilename = basename(sourceFile, '.linscript');

  // Find the corresponding .lin file in workspace/modded
  // All script files are in Dr1/data/us/script/ directory
  const correspondingLinFile = join(MODDED_DIR, 'Dr1/data/us/script', `${baseFilename}.lin`);

  if (!existsSync(correspondingLinFile)) {
    console.error(`Error: Corresponding .lin file not found: ${correspondingLinFile}`);
    console.error(`Looking for: Dr1/data/us/script/${baseFilename}.lin`);
    process.exit(1);
  }

  // Calculate the output path in MOD_DIR (same structure as .lin files)
  const outputFile = join(MOD_DIR, 'Dr1/data/us/script', `${baseFilename}.linscript`);

  console.log(`Selecting: ${basename(sourceFile)}`);
  console.log(`Found:     Dr1/data/us/script/${baseFilename}.lin`);
  console.log(`Output:    ${relative(projectRoot, outputFile)}`);

  // Create output directory
  await mkdir(dirname(outputFile), { recursive: true });

  // Copy the linscript file and make it writable
  await copyFile(sourceFile, outputFile);
  await execAsync(`chmod u+w "${outputFile}"`);

  console.log(`\n✓ Created writable copy: ${relative(projectRoot, outputFile)}`);

  // Open the file in VSCode
  try {
    await execAsync(`code "${outputFile}"`);
  } catch (error) {
    // Silently fail if 'code' command is not available
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  const inputPath = args[0];

  try {
    const ext = extname(inputPath);

    if (ext === '.lin') {
      await handleLinFile(inputPath);
    } else if (ext === '.linscript') {
      await handleLinscriptFile(inputPath);
    } else {
      console.error('Error: File must be a .lin or .linscript file');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
