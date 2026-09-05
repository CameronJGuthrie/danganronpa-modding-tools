#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { loadScript } from "./loadScript.js";
import { options } from "./options.js";
import { writeCompiled, writeSource } from "./scriptWrite.js";

const USAGE = `
lin-compiler: danganronpa script (de)compiler
usage: lin-compiler [options] input [output]

options:
-h, --help\t\tdisplay this message
-d, --decompile\t\tdecompile the input file or directory (default is compile)
-s, --silent\t\tsuppress all non-error messages
--hex\t\t\toutput opcodes as hex codes instead of names (decompile only)
--indent-spaces N\tset indentation spaces per level (default: 2)

Batch processing:
  When input is a directory, all matching files will be processed:
  - Decompile mode: processes all .lin files to .linscript
  - Compile mode: processes all .linscript files to .lin
`;

interface CliArgs {
  decompile: boolean;
  indentSpaces: number;
  input: string;
  output: string | null;
}

function trimExtension(path: string): string {
  const ext = extname(path);
  return ext === "" ? path : path.slice(0, -ext.length);
}

export function parseArgs(argv: readonly string[]): CliArgs | null {
  let decompile = false;
  let indentSpaces = 2;
  const plainArgs: string[] = [];

  if (argv.length === 0) {
    return null;
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("-")) {
      plainArgs.push(a);
      continue;
    }

    switch (a) {
      case "-h":
      case "--help":
        return null;
      case "-d":
      case "--decompile":
        decompile = true;
        break;
      case "-s":
      case "--silent":
        options.silent = true;
        break;
      case "--hex":
        options.useHexOpcodes = true;
        break;
      case "--indent-spaces": {
        if (i + 1 >= argv.length) {
          throw new Error("error: --indent-spaces requires a numeric argument.");
        }
        const value = argv[i + 1];
        indentSpaces = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(indentSpaces)) {
          throw new Error("error: --indent-spaces must be a non-negative integer.");
        }
        i++; // Skip the next argument since we consumed it
        break;
      }
      default:
        // Unrecognised flags are ignored, as in the original compiler
        break;
    }
  }

  if (plainArgs.length === 0 || plainArgs.length > 2) {
    throw new Error("error: incorrect arguments.");
  }

  return {
    decompile,
    indentSpaces,
    input: plainArgs[0],
    output: plainArgs.length === 2 ? plainArgs[1] : null,
  };
}

async function processSingleFile(input: string, output: string, decompile: boolean, indentSpaces = 2): Promise<void> {
  const script = await loadScript(input, decompile);
  if (decompile) {
    await writeSource(script, output, indentSpaces);
  } else {
    await writeCompiled(script, output);
  }
}

async function processDirectory(directory: string, decompile: boolean, indentSpaces = 2): Promise<void> {
  const inputExtension = decompile ? ".lin" : ".linscript";
  const outputExtension = decompile ? ".linscript" : ".lin";

  const files = (await readdir(directory)).filter((name) => extname(name) === inputExtension).sort();

  if (files.length === 0) {
    console.log(`No *${inputExtension} files found in ${directory}`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const fileName of files) {
    const inputFile = join(directory, fileName);
    const outputFile = join(directory, basename(fileName, inputExtension) + outputExtension);

    try {
      if (!options.silent) {
        console.log(`Processing ${fileName}...`);
      }

      await processSingleFile(inputFile, outputFile, decompile, indentSpaces);
      successCount++;
    } catch (error) {
      console.error(`Error processing ${fileName}: ${error instanceof Error ? error.message : error}`);
      errorCount++;
    }
  }

  console.log(`\nBatch complete: ${successCount} succeeded, ${errorCount} failed`);
}

async function pathKind(path: string): Promise<"directory" | "file" | "missing"> {
  try {
    return (await stat(path)).isDirectory() ? "directory" : "file";
  } catch {
    return "missing";
  }
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
      await processDirectory(args.input, args.decompile, args.indentSpaces);
      break;
    case "file": {
      const output = args.output ?? trimExtension(args.input) + (args.decompile ? ".linscript" : ".lin");
      await processSingleFile(args.input, output, args.decompile, args.indentSpaces);
      break;
    }
    default:
      throw new Error(`error: input path not found: ${args.input}`);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
