#!/usr/bin/env node

import { readdir, stat, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { decompileDirectory } from "lin-compiler";
import { extractPak } from "../formats/pak-archiver.ts";
import { extractWad } from "../formats/wad-archiver.ts";
import { requireBaseFile, WAD_FILES, type WadFile } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { WORKBENCH_DIR } from "../lib/paths.ts";

const ALL_DIR = join(WORKBENCH_DIR, "all");

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
      const result = await decompileDirectory(dir);
      for (const failure of result.failed) {
        console.log(`    Failed: ${basename(failure.file)}: ${failure.error.message}`);
      }
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
  console.log(`Usage: extract-recursive.ts <wad>

Extracts a WAD archive, recursively unpacks every PAK inside it and decompiles
every .lin file. A backed-up WAD is extracted to workbench/all/<name>/, any
other .wad next to itself.

Arguments:
  wad    The name of a backed-up WAD (${WAD_FILES.join(", ")}),
         read from workbench/base_files/, or a path to a .wad file.

Example:
  node extract-recursive.ts dr1_data.wad`);
}

function isWadFile(name: string): name is WadFile {
  return (WAD_FILES as readonly string[]).includes(name);
}

/** Resolve the argument to a WAD on disk and the directory to extract it into. */
async function resolveWad(arg: string): Promise<{ wadPath: string; outputDir: string }> {
  const fileName = basename(arg);
  const name = basename(fileName, ".wad");
  try {
    await stat(arg);
    return { wadPath: arg, outputDir: join(dirname(arg), name) };
  } catch {
    if (isWadFile(fileName)) {
      return { wadPath: await requireBaseFile(fileName), outputDir: join(ALL_DIR, name) };
    }
    throw new Error(`File not found: ${arg}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  try {
    const { wadPath, outputDir } = await resolveWad(args[0]);

    console.log(`Starting recursive extraction...`);
    console.log(`Input: ${wadPath}`);
    console.log(`Output: ${outputDir}`);
    console.log();

    // Step 1: Extract WAD
    console.log(`Extracting ${wadPath} to ${outputDir}...`);
    await extractWad(wadPath, outputDir, (entryPath) => console.log(`  Extracting: ${entryPath}`));

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
