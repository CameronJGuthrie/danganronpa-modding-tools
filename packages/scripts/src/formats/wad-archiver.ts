#!/usr/bin/env node

/**
 * The game's `.wad` archives ("AGAR"): a header listing every file's path, size and offset
 * and a directory table, followed by the file contents back to back.
 *
 * The library never loads a whole archive into memory: the header is parsed from a prefix of
 * the file and entries are copied by byte range, so a 1.8 GB WAD costs a few megabytes to
 * read, extract or repack.
 */

import { createWriteStream } from "node:fs";
import { mkdir, open, readdir, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { errorMessage } from "../lib/errors.ts";

// Data Structures

/** A file inside an archive. `offset` is relative to the end of the header. */
export interface WadEntry {
  path: string;
  size: number;
  offset: number;
}

interface WadDirEntry {
  name: string;
  /** 0 for a file, 1 for a directory. */
  type: number;
}

interface WadDir {
  path: string;
  entries: WadDirEntry[];
}

export interface WadHeader {
  version: [number, number];
  extraHeader: Buffer;
  files: WadEntry[];
  dirs: WadDir[];
  /** Where the file contents start. */
  dataOffset: number;
}

// Header Reading

/** Thrown while parsing when the prefix read so far ends before the header does. */
class NeedMoreBytes extends Error {}

class Cursor {
  offset = 0;
  private readonly buffer: Buffer;
  private readonly length: number;

  constructor(buffer: Buffer, length: number) {
    this.buffer = buffer;
    this.length = length;
  }

  private need(count: number): void {
    if (this.offset + count > this.length) {
      throw new NeedMoreBytes();
    }
  }

  u8(): number {
    this.need(1);
    return this.buffer.readUInt8(this.offset++);
  }

  u32(): number {
    this.need(4);
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  u64(): number {
    this.need(8);
    const value = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return Number(value);
  }

  bytes(count: number): Buffer {
    this.need(count);
    const value = Buffer.from(this.buffer.subarray(this.offset, this.offset + count));
    this.offset += count;
    return value;
  }

  string(): string {
    return this.bytes(this.u32()).toString("utf8");
  }
}

function parseHeader(buffer: Buffer, length: number): WadHeader {
  const cursor = new Cursor(buffer, length);

  if (cursor.bytes(4).toString("ascii") !== "AGAR") {
    throw new Error("Not a WAD archive");
  }
  const version: [number, number] = [cursor.u32(), cursor.u32()];
  const extraHeader = cursor.bytes(cursor.u32());

  const files: WadEntry[] = [];
  const fileCount = cursor.u32();
  for (let i = 0; i < fileCount; i++) {
    const path = cursor.string().replace(/\\/g, "/");
    const size = cursor.u64();
    const offset = cursor.u64();
    files.push({ path, size, offset });
  }

  const dirs: WadDir[] = [];
  const dirCount = cursor.u32();
  for (let i = 0; i < dirCount; i++) {
    const path = cursor.string().replace(/\\/g, "/");
    const entries: WadDirEntry[] = [];
    const entryCount = cursor.u32();
    for (let j = 0; j < entryCount; j++) {
      const name = cursor.string();
      const type = cursor.u8();
      entries.push({ name, type });
    }
    dirs.push({ path, entries });
  }

  return { version, extraHeader, files, dirs, dataOffset: cursor.offset };
}

/** Parse the header of `wadPath`, reading as little of the file as the header needs. */
export async function readWadHeader(wadPath: string): Promise<WadHeader> {
  const fh = await open(wadPath, "r");
  try {
    let size = 1024 * 1024;
    for (;;) {
      const buffer = Buffer.alloc(size);
      const { bytesRead } = await fh.read(buffer, 0, size, 0);
      try {
        return parseHeader(buffer, bytesRead);
      } catch (error) {
        if (!(error instanceof NeedMoreBytes) || bytesRead < size) {
          throw error;
        }
        size *= 2;
      }
    }
  } finally {
    await fh.close();
  }
}

// Header Writing

function stringSize(value: string): number {
  return 4 + Buffer.byteLength(value, "utf8");
}

/**
 * The directory table of a file list: every directory in pre-order with its child files and
 * directories sorted by name, which is how the shipped archives are laid out.
 */
function buildDirs(files: WadEntry[]): WadDir[] {
  const children = new Map<string, Map<string, number>>();
  const dir = (path: string): Map<string, number> => {
    const existing = children.get(path);
    if (existing !== undefined) {
      return existing;
    }
    if (path !== "") {
      const slash = path.lastIndexOf("/");
      dir(slash === -1 ? "" : path.slice(0, slash)).set(path.slice(slash + 1), 1);
    }
    const entries = new Map<string, number>();
    children.set(path, entries);
    return entries;
  };
  dir("");
  for (const file of [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    const slash = file.path.lastIndexOf("/");
    dir(slash === -1 ? "" : file.path.slice(0, slash)).set(file.path.slice(slash + 1), 0);
  }
  return [...children].map(([path, entries]) => ({
    path,
    entries: [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([name, type]) => ({ name, type })),
  }));
}

/** Add `filePath` to a directory table, creating any directories it needs on the way. */
function addToDirs(dirs: WadDir[], filePath: string): void {
  const find = (path: string): WadDir => {
    let dir = dirs.find((candidate) => candidate.path === path);
    if (dir === undefined) {
      dir = { path, entries: [] };
      dirs.push(dir);
      if (path !== "") {
        const slash = path.lastIndexOf("/");
        find(slash === -1 ? "" : path.slice(0, slash)).entries.push({ name: path.slice(slash + 1), type: 1 });
      }
    }
    return dir;
  };
  const slash = filePath.lastIndexOf("/");
  const dir = find(slash === -1 ? "" : filePath.slice(0, slash));
  const name = filePath.slice(slash + 1);
  if (!dir.entries.some((entry) => entry.name === name)) {
    dir.entries.push({ name, type: 0 });
  }
}

function writeHeader(header: Omit<WadHeader, "dataOffset">): Buffer {
  let size = 4 + 4 + 4 + 4 + header.extraHeader.length + 4;
  for (const file of header.files) {
    size += stringSize(file.path) + 8 + 8;
  }
  size += 4;
  for (const dir of header.dirs) {
    size += stringSize(dir.path) + 4;
    for (const entry of dir.entries) {
      size += stringSize(entry.name) + 1;
    }
  }

  const buffer = Buffer.alloc(size);
  let offset = 0;
  const u8 = (value: number): void => {
    offset = buffer.writeUInt8(value, offset);
  };
  const u32 = (value: number): void => {
    offset = buffer.writeUInt32LE(value, offset);
  };
  const u64 = (value: number): void => {
    offset = buffer.writeBigUInt64LE(BigInt(value), offset);
  };
  const string = (value: string): void => {
    u32(Buffer.byteLength(value, "utf8"));
    offset += buffer.write(value, offset, "utf8");
  };

  offset += buffer.write("AGAR", offset, "ascii");
  u32(header.version[0]);
  u32(header.version[1]);
  u32(header.extraHeader.length);
  offset += header.extraHeader.copy(buffer, offset);
  u32(header.files.length);
  for (const file of header.files) {
    string(file.path);
    u64(file.size);
    u64(file.offset);
  }
  u32(header.dirs.length);
  for (const dir of header.dirs) {
    string(dir.path);
    u32(dir.entries.length);
    for (const entry of dir.entries) {
      string(entry.name);
      u8(entry.type);
    }
  }
  return buffer;
}

// Helpers

async function flatWalk(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files.sort();
}

const COPY_CHUNK = 8 * 1024 * 1024;

/** Copy `size` bytes of `fh` starting at `position` to `out`. */
async function copyRange(
  fh: Awaited<ReturnType<typeof open>>,
  position: number,
  size: number,
  out: NodeJS.WritableStream,
): Promise<void> {
  const chunk = Buffer.alloc(Math.min(COPY_CHUNK, size));
  let remaining = size;
  while (remaining > 0) {
    const { bytesRead } = await fh.read(chunk, 0, Math.min(chunk.length, remaining), position + size - remaining);
    if (bytesRead === 0) {
      throw new Error("Unexpected end of archive");
    }
    const written = out.write(Buffer.from(chunk.subarray(0, bytesRead)));
    if (!written) {
      await new Promise<void>((resolve) => out.once("drain", resolve));
    }
    remaining -= bytesRead;
  }
}

// Library

/** Every entry of `wadPath`. */
export async function listWad(wadPath: string): Promise<WadEntry[]> {
  return (await readWadHeader(wadPath)).files;
}

/** The contents of the entry at `entryPath` inside `wadPath`. */
export async function readWadEntry(wadPath: string, entryPath: string): Promise<Buffer> {
  const header = await readWadHeader(wadPath);
  const entry = header.files.find((file) => file.path === entryPath);
  if (entry === undefined) {
    throw new Error(`${entryPath} is not in ${wadPath}`);
  }
  const fh = await open(wadPath, "r");
  try {
    const buffer = Buffer.alloc(entry.size);
    const { bytesRead } = await fh.read(buffer, 0, entry.size, header.dataOffset + entry.offset);
    if (bytesRead !== entry.size) {
      throw new Error(`${entryPath} is truncated in ${wadPath}`);
    }
    return buffer;
  } finally {
    await fh.close();
  }
}

/** Extract every entry of `wadPath` under `outputDir`; `onFile` is called with each entry's path first. */
export async function extractWad(
  wadPath: string,
  outputDir: string,
  onFile?: (entryPath: string) => void,
): Promise<WadEntry[]> {
  const header = await readWadHeader(wadPath);
  const fh = await open(wadPath, "r");
  try {
    for (const file of header.files) {
      onFile?.(file.path);
      const outputPath = join(outputDir, file.path);
      await mkdir(dirname(outputPath), { recursive: true });
      const out = createWriteStream(outputPath);
      await copyRange(fh, header.dataOffset + file.offset, file.size, out);
      out.end();
      await new Promise<void>((resolve, reject) => {
        out.once("finish", resolve);
        out.once("error", reject);
      });
    }
  } finally {
    await fh.close();
  }
  return header.files;
}

export interface CreateWadOptions {
  /** Directories whose files become entries, by path relative to the directory. The first directory holding a path wins. */
  inputDirs: string[];
  /** An archive whose entries are kept wherever no input directory replaces them. Replaced entries keep their position. */
  baseWad?: string;
  /** Called with each entry's path as it is written. */
  onFile?: (entryPath: string, source: "input" | "base") => void;
}

/** Write `outputPath` from the input directories layered over the base archive. */
export async function createWad(outputPath: string, options: CreateWadOptions): Promise<WadEntry[]> {
  type Source = { kind: "input"; physicalPath: string } | { kind: "base"; entry: WadEntry };
  const sources = new Map<string, Source>();

  for (const dir of options.inputDirs) {
    for (const physicalPath of await flatWalk(dir)) {
      const entryPath = relative(dir, physicalPath).replace(/\\/g, "/");
      if (!sources.has(entryPath)) {
        sources.set(entryPath, { kind: "input", physicalPath });
      }
    }
  }

  // With a base archive, entries keep its order and its directory table (whose ordering is the
  // game's own and not reproducible), and new paths are appended to both.
  let version: [number, number] = [1, 1];
  let extraHeader: Buffer = Buffer.alloc(0);
  let order: string[] = [...sources.keys()];
  let dirs: WadDir[] | null = null;
  if (options.baseWad !== undefined) {
    const base = await readWadHeader(options.baseWad);
    version = base.version;
    extraHeader = base.extraHeader;
    const added = order.filter((entryPath) => !base.files.some((file) => file.path === entryPath));
    for (const entry of base.files) {
      if (!sources.has(entry.path)) {
        sources.set(entry.path, { kind: "base", entry });
      }
    }
    order = [...base.files.map((file) => file.path), ...added];
    dirs = base.dirs;
    for (const entryPath of added) {
      addToDirs(dirs, entryPath);
    }
  }

  const files: WadEntry[] = [];
  let offset = 0;
  for (const entryPath of order) {
    const source = sources.get(entryPath);
    if (source === undefined) throw new Error(`unreachable: no source for ${entryPath}`);
    const size = source.kind === "input" ? (await stat(source.physicalPath)).size : source.entry.size;
    files.push({ path: entryPath, size, offset });
    offset += size;
  }

  const header = writeHeader({ version, extraHeader, files, dirs: dirs ?? buildDirs(files) });
  const baseHandle = options.baseWad === undefined ? null : await open(options.baseWad, "r");
  const baseDataOffset = options.baseWad === undefined ? 0 : (await readWadHeader(options.baseWad)).dataOffset;
  const out = createWriteStream(outputPath);
  try {
    out.write(header);
    for (const file of files) {
      const source = sources.get(file.path);
      if (source === undefined) throw new Error(`unreachable: no source for ${file.path}`);
      options.onFile?.(file.path, source.kind);
      if (source.kind === "input") {
        const fh = await open(source.physicalPath, "r");
        try {
          await copyRange(fh, 0, file.size, out);
        } finally {
          await fh.close();
        }
      } else if (baseHandle !== null) {
        await copyRange(baseHandle, baseDataOffset + source.entry.offset, file.size, out);
      }
    }
    out.end();
    await new Promise<void>((resolve, reject) => {
      out.once("finish", resolve);
      out.once("error", reject);
    });
  } finally {
    await baseHandle?.close();
  }
  return files;
}

// CLI

function showUsage(): void {
  console.log(`Usage: wad-archiver.ts [options] <command> [args...]

Commands:
  list <input.wad>                              List files in archive
  extract <input.wad> <output-dir>              Extract files from archive
  create [--base <base.wad>] <input-dir>... <output.wad>
                                                Create an archive from the directories (first
                                                wins), keeping the base archive's other entries

Options:
  -s, --silent                                  Disable all output
  -h, --help                                    Show this help`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    showUsage();
    process.exit(0);
  }

  let silent = false;
  let baseWad: string | undefined;
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-s" || arg === "--silent") {
      silent = true;
    } else if (arg === "--base") {
      baseWad = args[++i];
    } else {
      positional.push(arg);
    }
  }

  const [command, ...rest] = positional;
  const log = silent ? () => {} : console.log;

  try {
    if (command === "list") {
      if (rest.length < 1) throw new Error("list command requires input file");
      for (const file of await listWad(rest[0])) {
        console.log(file.path);
      }
    } else if (command === "extract") {
      if (rest.length < 2) throw new Error("extract command requires input file and output directory");
      await extractWad(rest[0], rest[1], (entryPath) => log("Saved", join(rest[1], entryPath)));
    } else if (command === "create") {
      if (rest.length < 2) throw new Error("create command requires input directory and output file");
      const outputPath = rest[rest.length - 1];
      await createWad(outputPath, {
        inputDirs: rest.slice(0, -1),
        baseWad,
        onFile: (entryPath, source) => log(source === "input" ? "Adding" : "Keeping", entryPath),
      });
    } else {
      showUsage();
      throw new Error(`Unknown command '${command}'`);
    }
  } catch (error) {
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
