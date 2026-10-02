import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { readCompiledFile } from "./lin-reader.ts";
import { writeCompiledFile } from "./lin-writer.ts";
import { readSourceFile } from "./linscript-reader.ts";
import { type WriteSourceOptions, writeSourceFile } from "./linscript-writer.ts";

/** One file a batch conversion could not convert, with the reason. */
export interface BatchFailure {
  /** Absolute path of the input file. */
  file: string;
  error: Error;
}

/** Outcome of converting a directory: files are absolute paths, in the order they were processed. */
export interface BatchResult {
  succeeded: string[];
  failed: BatchFailure[];
}

/** Decompile one `.lin` file to `.linscript`. */
export async function decompileFile(input: string, output: string, options: WriteSourceOptions = {}): Promise<void> {
  await writeSourceFile(await readCompiledFile(input), output, options);
}

/** Compile one `.linscript` file to `.lin`. */
export async function compileFile(input: string, output: string): Promise<void> {
  await writeCompiledFile(await readSourceFile(input), output);
}

/**
 * Decompile every `*.lin` directly inside `directory` to a sibling `*.linscript`. One file's
 * failure does not stop the others; `onFile` is called before each conversion.
 */
export function decompileDirectory(
  directory: string,
  options: WriteSourceOptions = {},
  onFile?: (fileName: string) => void,
): Promise<BatchResult> {
  return convertDirectory(directory, ".lin", ".linscript", (i, o) => decompileFile(i, o, options), onFile);
}

/**
 * Compile every `*.linscript` directly inside `directory` to a sibling `*.lin`. One file's
 * failure does not stop the others; `onFile` is called before each conversion.
 */
export function compileDirectory(directory: string, onFile?: (fileName: string) => void): Promise<BatchResult> {
  return convertDirectory(directory, ".linscript", ".lin", compileFile, onFile);
}

async function convertDirectory(
  directory: string,
  inputExt: string,
  outputExt: string,
  convert: (input: string, output: string) => Promise<void>,
  onFile?: (fileName: string) => void,
): Promise<BatchResult> {
  const files = (await readdir(directory)).filter((name) => extname(name) === inputExt).sort();
  const result: BatchResult = { succeeded: [], failed: [] };

  for (const fileName of files) {
    onFile?.(fileName);
    const input = join(directory, fileName);
    try {
      await convert(input, join(directory, basename(fileName, inputExt) + outputExt));
      result.succeeded.push(input);
    } catch (error) {
      result.failed.push({ file: input, error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  return result;
}
