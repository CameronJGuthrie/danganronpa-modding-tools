#!/usr/bin/env node

/**
 * extract-linscript.ts (`pnpm run reset`)
 *
 * Regenerates `workbench/exploration/`, the read-only copy of the game data a modder looks
 * around in:
 *
 *   exploration/wad_<name>/...                       every file of each WAD in base_files
 *   exploration/chapter_CC/scene_SSS/eCC_SSS_NNN.linscript
 *                                                    the decompiled scripts of dr1_data_us
 *
 * Nothing here is an input to the build: `pnpm run build` packs the game's WADs from
 * `base_files/` plus the compiled mod, so this directory can be deleted and regenerated freely.
 */

import { existsSync } from "node:fs";
import { chmod, mkdir, readdir, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { decompileFile } from "lin-compiler";
import { extractWad, readWadHeader } from "../formats/wad-archiver.ts";
import { baseFilePath, WAD_FILES } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { explorationScriptPath, explorationWadDir, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { EXPLORATION_DIR } from "../lib/paths.ts";
import { ProgressBar } from "../lib/progress.ts";

/** Extract every backed-up WAD to `exploration/wad_<name>/`, replacing what was there. */
async function extractWads(): Promise<void> {
  for (const wadFile of WAD_FILES) {
    const wadPath = baseFilePath(wadFile);
    if (!existsSync(wadPath)) {
      console.warn(`Warning: ${wadFile} is not in base_files, skipping`);
      continue;
    }
    const outputDir = join(EXPLORATION_DIR, explorationWadDir(wadFile));
    await rm(outputDir, { recursive: true, force: true });
    const total = (await readWadHeader(wadPath)).files.length;
    const progress = new ProgressBar(wadFile, total);
    await extractWad(wadPath, outputDir, (entryPath) => progress.tick(entryPath));
    progress.finish(`✓ ${wadFile}: ${total} files`);
  }
}

/**
 * Decompile every `.lin` of the extracted dr1_data_us script directory into
 * `exploration/chapter_CC/scene_SSS/eCC_SSS_NNN.linscript`. Returns the written paths.
 */
async function decompileScripts(): Promise<string[]> {
  const scriptDir = join(EXPLORATION_DIR, explorationWadDir("dr1_data_us.wad"), ...SCRIPT_DIR_SEGMENTS);
  if (!existsSync(scriptDir)) {
    throw new Error(`Script directory not found: ${scriptDir}`);
  }

  for (const entry of await readdir(EXPLORATION_DIR)) {
    if (entry.startsWith("chapter_")) {
      await rm(join(EXPLORATION_DIR, entry), { recursive: true, force: true });
    }
  }

  const lins = (await readdir(scriptDir)).filter((name) => name.endsWith(".lin")).sort();
  const progress = new ProgressBar("decompiling", lins.length);
  const written: string[] = [];
  const failed: string[] = [];
  for (const lin of lins) {
    progress.setStatus(lin);
    const flatName = basename(lin, ".lin");
    const output = join(EXPLORATION_DIR, explorationScriptPath(flatName));
    await mkdir(dirname(output), { recursive: true });
    try {
      await decompileFile(join(scriptDir, lin), output);
      written.push(output);
    } catch (error) {
      failed.push(`${lin}: ${errorMessage(error)}`);
    }
    progress.tick(lin);
  }
  progress.finish(`✓ decompiled ${written.length} scripts`);
  for (const failure of failed) {
    console.error(`  Failed: ${failure}`);
  }
  return written;
}

/** The exploration directory is for reading: every file in it is made read-only. */
async function makeReadOnly(directory: string): Promise<number> {
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      count += await makeReadOnly(fullPath);
    } else {
      await chmod(fullPath, 0o444);
      count++;
    }
  }
  return count;
}

async function main(): Promise<void> {
  try {
    console.log("Regenerating workbench/exploration...\n");
    await mkdir(EXPLORATION_DIR, { recursive: true });

    await extractWads();
    await decompileScripts();

    const count = await makeReadOnly(EXPLORATION_DIR);
    console.log(`\n✓ Complete! ${count} read-only files in workbench/exploration/`);
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
