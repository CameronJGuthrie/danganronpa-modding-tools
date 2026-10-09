#!/usr/bin/env node

import { stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { extractWad } from "../formats/wad-archiver.ts";
import { requireBaseFile, WAD_FILES, type WadFile } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { decompileLinsUnder, extractPaksUnder } from "../lib/extract-tree.ts";
import { WORKBENCH_DIR } from "../lib/paths.ts";

const ALL_DIR = join(WORKBENCH_DIR, "all");

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
    const paks = await extractPaksUnder(outputDir, (pakPath) => console.log(`  Unpacking: ${pakPath}`));
    console.log(`  ${paks} paks unpacked`);

    console.log();
    console.log("PAK extraction complete. Decompiling LIN files...");
    console.log();

    // Step 3: Find and decompile all .lin files
    const result = await decompileLinsUnder(outputDir, (directory) => console.log(`  Decompiling: ${directory}`));
    for (const failure of result.failed) {
      console.log(`    Failed: ${basename(failure.file)}: ${failure.error.message}`);
    }
    console.log(`  ${result.succeeded.length} scripts decompiled`);

    console.log();
    console.log("Recursive extraction complete!");
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

main();
