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
 *                                  With `--convert image video`, every `.tga` is also converted
 *                                  to `.tga.png` and every `.ivf` movie re-encoded to `.ivf.mp4`
 *                                  (originals removed; movies need ffmpeg on PATH)
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
import { convertIvfsUnder, convertTgasUnder, decompileLinsUnder, extractPaksUnder } from "../lib/extract-tree.ts";
import { explorationScriptPath, explorationWadDir, flatScriptName, SCRIPT_DIR_SEGMENTS } from "../lib/mod-scripts.ts";
import { EXPLORATION_DIR } from "../lib/paths.ts";
import { OverallProgress, ProgressBar } from "../lib/progress.ts";

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

/** The steps of extracting one WAD, in order; each has a progress bar. */
const WAD_STEPS = ["extract", "paks", "scripts", "textures", "movies"] as const;
type WadStep = (typeof WAD_STEPS)[number];

/**
 * What `--convert` can name. Scripts (`text`) are always decompiled, since the chapter folders
 * are built from them; `image` and `video` are opt-in because they take most of a run's time.
 */
const CONVERT_KINDS = ["text", "image", "video"] as const;
type ConvertKind = (typeof CONVERT_KINDS)[number];

interface Options {
  convert: ReadonlySet<ConvertKind>;
  timings: boolean;
}

function showUsage(): void {
  console.log(`Usage: pnpm run reset [--convert [text] [image] [video]] [--timings]

Regenerates workbench/exploration/ from the WADs in workbench/base_files/: every .pak is
unpacked and every .lin decompiled to .linscript. Options:
  --convert KIND...  also convert media: image (.tga -> .tga.png), video (.ivf -> .ivf.mp4,
                     needs ffmpeg). text (.lin -> .linscript) is always on and may be listed
                     for clarity.
  --timings          print how long each step took, for updating the estimates in this script`);
}

function parseOptions(args: string[]): Options {
  const convert = new Set<ConvertKind>(["text"]);
  let timings = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--timings") {
      timings = true;
    } else if (arg === "--convert") {
      let any = false;
      while (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        const kind = args[++i];
        if (!(CONVERT_KINDS as readonly string[]).includes(kind)) {
          throw new Error(`Unknown --convert kind "${kind}"; expected ${CONVERT_KINDS.join(", ")}`);
        }
        convert.add(kind as ConvertKind);
        any = true;
      }
      if (!any) {
        throw new Error(`--convert needs at least one of ${CONVERT_KINDS.join(", ")}`);
      }
    } else {
      throw new Error(`Unknown argument "${arg}"`);
    }
  }
  return { convert, timings };
}

/** The steps of one WAD that `options` turn on. */
function wadSteps(options: Options): WadStep[] {
  return WAD_STEPS.filter(
    (step) =>
      (step !== "textures" || options.convert.has("image")) && (step !== "movies" || options.convert.has("video")),
  );
}

/** The steps after every WAD is extracted, in order; neither has a bar of its own. */
const FINAL_STEPS = ["organise", "read-only"] as const;
type FinalStep = (typeof FINAL_STEPS)[number];

interface ExpectedWad {
  /** How many paks (nested ones included), scripts, textures and movie frames the WAD held when last counted. */
  counts: Record<Exclude<WadStep, "extract">, number>;
  /** How long each step took, averaged over three runs (`--timings` prints a run's). */
  seconds: Record<WadStep, number>;
}

/**
 * What a run looked like the last time it was measured, used as the progress bars' totals (the
 * steps only learn their real counts at the end) and as the weights and estimate of the overall
 * bar. Mods replace files rather than add or remove them, so these stay close; update them from
 * the "unpacked"/"decompiled"/"converted" lines and from `pnpm run reset --timings` if they drift.
 */
const EXPECTED: Record<WadFile, ExpectedWad> = {
  "dr1_data.wad": {
    counts: { paks: 400, scripts: 0, textures: 5869, movies: 8504 },
    seconds: { extract: 2.7, paks: 1.5, scripts: 0, textures: 17.3, movies: 34.5 },
  },
  "dr1_data_us.wad": {
    counts: { paks: 407, scripts: 2177, textures: 6424, movies: 37317 },
    seconds: { extract: 0.9, paks: 1.6, scripts: 0.9, textures: 15.4, movies: 139.1 },
  },
  "dr1_data_keyboard_us.wad": {
    counts: { paks: 29, scripts: 0, textures: 1140, movies: 0 },
    seconds: { extract: 0.1, paks: 0.2, scripts: 0, textures: 1.1, movies: 0 },
  },
  "dr1_data_keyboard.wad": {
    counts: { paks: 7, scripts: 0, textures: 180, movies: 0 },
    seconds: { extract: 0.1, paks: 0.1, scripts: 0, textures: 0.4, movies: 0 },
  },
};
const EXPECTED_FINAL_SECONDS: Record<FinalStep, number> = { organise: 0.2, "read-only": 0.6 };

/** The overall bar's step name for a step of one WAD. */
function stepName(wadFile: WadFile, step: WadStep): string {
  return `${wadFile} ${step}`;
}

/** Extract `wadFile` to `exploration/wad_<name>/`, replacing what was there, and make it browsable. */
async function extractWadTree(wadFile: WadFile, options: Options, overall: OverallProgress): Promise<string> {
  const wadPath = baseFilePath(wadFile);
  const outputDir = join(EXPLORATION_DIR, explorationWadDir(wadFile));
  await rm(outputDir, { recursive: true, force: true });
  const expected = EXPECTED[wadFile].counts;

  const total = (await readWadHeader(wadPath)).files.length;
  let progress = new ProgressBar(stepName(wadFile, "extract"), total, overall);
  await extractWad(wadPath, outputDir, (entryPath) => progress.tick(entryPath));
  progress.finish(`✓ ${wadFile}: ${total} files`);

  progress = new ProgressBar(stepName(wadFile, "paks"), expected.paks, overall);
  const unpacked = await extractPaksUnder(outputDir, (pakPath) => progress.tick(basename(pakPath)));
  progress.finish(`✓ ${wadFile}: ${unpacked} paks unpacked`);

  progress = new ProgressBar(stepName(wadFile, "scripts"), expected.scripts, overall);
  const result = await decompileLinsUnder(outputDir, (linPath) => progress.tick(relative(outputDir, linPath)));
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

  if (options.convert.has("image")) {
    progress = new ProgressBar(stepName(wadFile, "textures"), expected.textures, overall);
    const converted = await convertTgasUnder(outputDir, (tgaPath) => progress.tick(relative(outputDir, tgaPath)));
    const skipped =
      converted.skipped.length > 0 ? ` (${converted.skipped.length} .tga files are not images, skipped)` : "";
    progress.finish(`✓ ${wadFile}: ${converted.succeeded.length} textures converted to png${skipped}`);
    for (const failure of converted.failed) {
      console.error(`  Failed: ${relative(outputDir, failure.file)}: ${failure.error}`);
    }
  }

  if (options.convert.has("video")) {
    // The bar counts frames, since each movie takes seconds to encode
    progress = new ProgressBar(stepName(wadFile, "movies"), expected.movies, overall);
    const movies = await convertIvfsUnder(outputDir, (frames, ivfPath) =>
      progress.tick(relative(outputDir, ivfPath), frames),
    );
    if (movies.ffmpegMissing) {
      progress.finish(`! ${wadFile}: ffmpeg is not installed, movies left as .ivf`);
    } else {
      progress.finish(`✓ ${wadFile}: ${movies.succeeded.length} movies converted to mp4`);
    }
    for (const failure of movies.failed) {
      console.error(`  Failed: ${relative(outputDir, failure.file)}: ${failure.error}`);
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

/** Print how long each step of the run took, in the shape of the `seconds` tables above. */
function printTimings(overall: OverallProgress): void {
  console.log("\nStep timings (seconds):");
  for (const { name, seconds } of overall.getTimings()) {
    console.log(`  ${name.padEnd(36)} ${seconds.toFixed(1)}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    showUsage();
    return;
  }
  try {
    const options = parseOptions(args);
    console.log("Regenerating workbench/exploration...\n");
    await mkdir(EXPLORATION_DIR, { recursive: true });

    const wadFiles = WAD_FILES.filter((wadFile) => {
      if (existsSync(baseFilePath(wadFile))) {
        return true;
      }
      console.warn(`Warning: ${wadFile} is not in base_files, skipping`);
      return false;
    });
    const overall = new OverallProgress([
      ...wadFiles.flatMap((wadFile) =>
        wadSteps(options).map((step) => ({ name: stepName(wadFile, step), seconds: EXPECTED[wadFile].seconds[step] })),
      ),
      ...FINAL_STEPS.map((step) => ({ name: step, seconds: EXPECTED_FINAL_SECONDS[step] })),
    ]);
    overall.draw();

    let usDir: string | null = null;
    for (const wadFile of wadFiles) {
      const dir = await extractWadTree(wadFile, options, overall);
      if (wadFile === "dr1_data_us.wad") {
        usDir = dir;
      }
    }
    if (usDir === null) {
      throw new Error('dr1_data_us.wad is not in base_files; run "pnpm run setup" first');
    }

    overall.begin("organise");
    const organised = await organiseScripts(usDir);
    overall.end();
    overall.clear();
    console.log(`✓ ${organised} scripts organised by chapter and scene`);
    overall.draw();

    overall.begin("read-only");
    const count = await makeReadOnly(EXPLORATION_DIR);
    overall.end();
    overall.clear();
    console.log(`\n✓ Complete! ${count} read-only files in workbench/exploration/`);
    if (options.timings) {
      printTimings(overall);
    }
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
