#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { readCompiledFile } from "./io/lin-reader.ts";
import { writeCompiledFile } from "./io/lin-writer.ts";
import { readSourceFile } from "./io/linscript-reader.ts";
import { DEFAULT_INDENT_SPACES, type WriteSourceOptions, writeSourceFile } from "./io/linscript-writer.ts";

const USAGE = `
lin-compiler: danganronpa script (de)compiler
usage: lin-compiler [options] input [output]

options:
-h, --help\t\tdisplay this message
-d, --decompile\t\tdecompile the input file or directory (default is compile)
-s, --silent\t\tsuppress all non-error messages
--hex\t\t\toutput opcodes as hex codes instead of names (decompile only)
--indent-spaces N\tset indentation spaces per level (default: ${DEFAULT_INDENT_SPACES})

Batch processing:
  When input is a directory, all matching files will be processed:
  - Decompile mode: processes all .lin files to .linscript
  - Compile mode: processes all .linscript files to .lin
`;

type Mode = "compile" | "decompile";

interface CliArgs {
  mode: Mode;
  silent: boolean;
  source: WriteSourceOptions;
  input: string;
  output: string | null;
}

const EXTENSIONS: Record<Mode, { input: string; output: string }> = {
  compile: { input: ".linscript", output: ".lin" },
  decompile: { input: ".lin", output: ".linscript" },
};

/** Parse command-line arguments; returns null when usage should be shown instead. */
export function parseArgs(argv: readonly string[]): CliArgs | null {
  if (argv.length === 0) {
    return null;
  }
  const args: CliArgs = { mode: "compile", silent: false, source: {}, input: "", output: null };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        return null;
      case "-d":
      case "--decompile":
        args.mode = "decompile";
        break;
      case "-s":
      case "--silent":
        args.silent = true;
        break;
      case "--hex":
        args.source.hexOpcodes = true;
        break;
      case "--indent-spaces": {
        const value = argv[++i];
        if (value === undefined || !/^\d+$/.test(value)) {
          throw new Error("error: --indent-spaces requires a non-negative integer.");
        }
        args.source.indentSpaces = Number(value);
        break;
      }
      default:
        if (arg.startsWith("-")) {
          // Unrecognised flags are ignored, as in the original compiler
          break;
        }
        positional.push(arg);
    }
  }

  if (positional.length === 0 || positional.length > 2) {
    throw new Error("error: incorrect arguments.");
  }
  args.input = positional[0];
  args.output = positional[1] ?? null;
  return args;
}

async function convertFile(input: string, output: string, args: CliArgs): Promise<void> {
  if (args.mode === "decompile") {
    await writeSourceFile(await readCompiledFile(input), output, args.source);
  } else {
    await writeCompiledFile(await readSourceFile(input), output);
  }
}

async function convertDirectory(directory: string, args: CliArgs): Promise<void> {
  const ext = EXTENSIONS[args.mode];
  const files = (await readdir(directory)).filter((name) => extname(name) === ext.input).sort();

  if (files.length === 0) {
    console.log(`No *${ext.input} files found in ${directory}`);
    return;
  }

  let succeeded = 0;
  let failed = 0;
  for (const fileName of files) {
    if (!args.silent) {
      console.log(`Processing ${fileName}...`);
    }
    try {
      await convertFile(join(directory, fileName), join(directory, basename(fileName, ext.input) + ext.output), args);
      succeeded++;
    } catch (error) {
      console.error(`Error processing ${fileName}: ${errorMessage(error)}`);
      failed++;
    }
  }

  console.log(`\nBatch complete: ${succeeded} succeeded, ${failed} failed`);
}

async function pathKind(path: string): Promise<"directory" | "file" | "missing"> {
  try {
    return (await stat(path)).isDirectory() ? "directory" : "file";
  } catch {
    return "missing";
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function main(argv: readonly string[]): Promise<void> {
  const args = parseArgs(argv);
  if (args === null) {
    console.log(USAGE);
    return;
  }

  switch (await pathKind(args.input)) {
    case "directory":
      if (args.output !== null) {
        throw new Error("error: output path not supported for directory batch processing.");
      }
      await convertDirectory(args.input, args);
      break;
    case "file": {
      const defaultOutput = args.input.slice(0, -extname(args.input).length || undefined) + EXTENSIONS[args.mode].output;
      await convertFile(args.input, args.output ?? defaultOutput, args);
      if (!args.silent) {
        console.log(`Wrote ${args.output ?? defaultOutput}`);
      }
      break;
    }
    default:
      throw new Error(`error: input path not found: ${args.input}`);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
