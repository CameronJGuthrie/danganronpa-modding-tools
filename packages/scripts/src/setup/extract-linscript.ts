#!/usr/bin/env node

/**
 * extract-linscript.ts (`pnpm run reset`)
 *
 * Regenerates `workbench/exploration/`, the read-only copy of the game data a modder looks
 * around in:
 *
 *   exploration/wad_<name>/...     every file of each WAD in base_files, with every `.pak`
 *                                  unpacked into a folder of the same name and every `.lin`
 *                                  decompiled to `.linscript` (the originals removed)
 *   exploration/chapter_CC/scene_SSS/eCC_SSS_NNN.linscript
 *                                  the decompiled scripts of dr1_data_us, by chapter and scene
 *
 * Nothing here is an input to the build: `pnpm run build` packs the game's WADs from
 * `base_files/` plus the compiled mod, so this directory can be deleted and regenerated freely.
 */

import { existsSync } from "node:fs";
import { chmod, copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { extractWad, readWadHeader } from "../formats/wad-archiver.ts";
import { baseFilePath, WAD_FILES, type WadFile } from "../lib/base-files.ts";
import { errorMessage } from "../lib/errors.ts";
import { decompileLinsUnder, extractPaksUnder } from "../lib/extract-tree.ts";
import { explorationScriptPath, explorationWadDir, flatScriptName, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { EXPLORATION_DIR } from "../lib/paths.ts";
import { ProgressBar } from "../lib/progress.ts";

/**
 * Shipped scripts the decompiler is known not to read. A failure on one of these is expected
 * and not reported; a failure on any other file, or one of these decompiling after all, is.
 */
const EXPECTED_FAILURES: ReadonlySet<string> = new Set([
  // A leftover of an older build in a different opcode numbering (every id one or two below the
  // PC table's: LoadScript is 0x18, Goto 0x33, Then 0x3a) with untranslated Japanese text.
  // It is the Trash Room entry script of the chapter 10 demo, and no script ever loads it.
  "e10_000_137.lin",
]);

/** Extract `wadFile` to `exploration/wad_<name>/`, replacing what was there, and make it browsable. */
async function extractWadTree(wadFile: WadFile): Promise<string> {
  const wadPath = baseFilePath(wadFile);
  const outputDir = join(EXPLORATION_DIR, explorationWadDir(wadFile));
  await rm(outputDir, { recursive: true, force: true });

  const total = (await readWadHeader(wadPath)).files.length;
  let progress = new ProgressBar(`${wadFile} extract`, total);
  await extractWad(wadPath, outputDir, (entryPath) => progress.tick(entryPath));
  progress.finish(`✓ ${wadFile}: ${total} files`);

  progress = new ProgressBar(`${wadFile} paks`, 1);
  let paks = 0;
  const unpacked = await extractPaksUnder(outputDir, (pakPath) => {
    if (paks++ === 0) {
      progress.setStatus(basename(pakPath));
    } else {
      progress.tick(basename(pakPath));
    }
  });
  progress.setTotal(Math.max(unpacked, 1));
  progress.finish(`✓ ${wadFile}: ${unpacked} paks unpacked`);

  progress = new ProgressBar(`${wadFile} scripts`, 1);
  const result = await decompileLinsUnder(outputDir, (directory) => progress.setStatus(relative(outputDir, directory)));
  progress.finish(`✓ ${wadFile}: ${result.succeeded.length} scripts decompiled`);

  for (const failure of result.failed) {
    const name = basename(failure.file);
    if (!EXPECTED_FAILURES.has(name)) {
      console.error(`  Failed: ${relative(outputDir, failure.file)}: ${failure.error.message}`);
    }
  }
  for (const name of EXPECTED_FAILURES) {
    if (result.succeeded.some((file) => basename(file, ".linscript") === basename(name, ".lin"))) {
      console.error(`  ${name} decompiled although it is listed as an expected failure; remove it from the list`);
    }
  }
  return outputDir;
}

/**
 * Copy the decompiled dr1_data_us scripts into `exploration/chapter_CC/scene_SSS/eCC_SSS_NNN.linscript`.
 */
async function organiseScripts(wadDir: string): Promise<number> {
  const scriptDir = join(wadDir, ...SCRIPT_DIR_SEGMENTS);
  if (!existsSync(scriptDir)) {
    throw new Error(`Script directory not found: ${scriptDir}`);
  }
  for (const entry of await readdir(EXPLORATION_DIR)) {
    if (entry.startsWith("chapter_")) {
      await rm(join(EXPLORATION_DIR, entry), { recursive: true, force: true });
    }
  }

  let count = 0;
  for (const file of (await readdir(scriptDir)).sort()) {
    const flatName = basename(file, ".linscript");
    if (!file.endsWith(".linscript") || flatScriptName(file) !== flatName) {
      continue;
    }
    const output = join(EXPLORATION_DIR, explorationScriptPath(flatName));
    await mkdir(dirname(output), { recursive: true });
    await copyFile(join(scriptDir, file), output);
    count++;
  }
  return count;
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

    let usDir: string | null = null;
    for (const wadFile of WAD_FILES) {
      if (!existsSync(baseFilePath(wadFile))) {
        console.warn(`Warning: ${wadFile} is not in base_files, skipping`);
        continue;
      }
      const dir = await extractWadTree(wadFile);
      if (wadFile === "dr1_data_us.wad") {
        usDir = dir;
      }
    }
    if (usDir === null) {
      throw new Error('dr1_data_us.wad is not in base_files; run "pnpm run setup" first');
    }
    const organised = await organiseScripts(usDir);
    console.log(`✓ ${organised} scripts organised by chapter and scene`);

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
