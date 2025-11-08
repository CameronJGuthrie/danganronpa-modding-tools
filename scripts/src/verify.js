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

const MODDED_DIR = join(projectRoot, 'workspace/modded/dr1_data_us');
const VERIFY_DIR = join(projectRoot, 'workspace/verify');
const LIN_COMPILER_PATH = join(projectRoot, 'lin-compiler', 'lin_compiler', 'bin', 'Release', 'net8.0', 'lin_compiler.dll');

function showUsage() {
  console.log(`Usage: pnpm verify <filepath>

Decompiles a .lin file from workspace/modded/ and places the .linscript in workspace/verify/

Examples:
  pnpm verify e01_004_135.lin
  pnpm verify Dr1/data/us/script/e01_004_135.lin
  pnpm verify workspace/modded/dr1_data_us/Dr1/data/us/script/e01_004_135.lin`);
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showUsage();
    process.exit(0);
  }

  const inputPath = args[0];

  try {
    const ext = extname(inputPath);

    if (ext !== '.lin') {
      console.error('Error: File must be a .lin file');
      process.exit(1);
    }

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

    // Calculate the output path in VERIFY_DIR
    const outputBase = basename(sourceFile, '.lin');
    const outputFile = join(VERIFY_DIR, `${outputBase}.linscript`);

    console.log(`Verifying: ${relative(MODDED_DIR, sourceFile)}`);
    console.log(`Output:    ${relative(projectRoot, outputFile)}`);

    // Create output directory
    await mkdir(VERIFY_DIR, { recursive: true });

    // Copy the .lin file to a temp location for decompilation
    const tempLinFile = join(VERIFY_DIR, basename(sourceFile));
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
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
