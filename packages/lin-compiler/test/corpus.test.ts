import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { BinaryError } from "../src/errors.ts";
import { readCompiled } from "../src/io/lin-reader.ts";
import { writeCompiledBytes } from "../src/io/lin-writer.ts";
import { readSource } from "../src/io/linscript-reader.ts";
import { writeSourceText } from "../src/io/linscript-writer.ts";

/** The game's archive as backed up by `pnpm run setup`; the shipped `.lin` files are read out of it. */
const CORPUS_WAD = fileURLToPath(new URL("../../../workbench/base_files/dr1_data_us.wad", import.meta.url));
const SCRIPT_DIR = "Dr1/data/us/script/";

/** The `.lin` entries of a WAD archive ("AGAR": a header of paths, sizes and offsets, then the contents). */
async function readScriptEntries(wadPath: string): Promise<Map<string, Uint8Array>> {
  const bytes = await readFile(wadPath);
  let pos = 4; // "AGAR"
  const u32 = () => {
    const value = bytes.readUInt32LE(pos);
    pos += 4;
    return value;
  };
  const u64 = () => {
    const value = Number(bytes.readBigUInt64LE(pos));
    pos += 8;
    return value;
  };
  const string = () => {
    const length = u32();
    const value = bytes.toString("utf8", pos, pos + length);
    pos += length;
    return value;
  };
  u32(); // version major
  u32(); // version minor
  const extraHeaderSize = u32();
  pos += extraHeaderSize;
  const files: { path: string; size: number; offset: number }[] = [];
  const fileCount = u32();
  for (let i = 0; i < fileCount; i++) {
    files.push({ path: string(), size: u64(), offset: u64() });
  }
  const dirCount = u32();
  for (let i = 0; i < dirCount; i++) {
    string();
    const entryCount = u32();
    for (let j = 0; j < entryCount; j++) {
      string();
      pos += 1;
    }
  }
  const entries = new Map<string, Uint8Array>();
  for (const file of files) {
    if (file.path.startsWith(SCRIPT_DIR) && file.path.endsWith(".lin")) {
      entries.set(
        file.path.slice(SCRIPT_DIR.length),
        new Uint8Array(bytes.subarray(pos + file.offset, pos + file.offset + file.size)),
      );
    }
  }
  return entries;
}

test("every game script round-trips through source and back", {
  skip: !existsSync(CORPUS_WAD) && "game archive not backed up",
}, async (t) => {
  const entries = await readScriptEntries(CORPUS_WAD);
  const files = [...entries.keys()].sort();
  assert.ok(files.length > 0, "the archive holds no scripts");

  let identicalToOriginal = 0;
  const unreadable: string[] = [];

  for (const file of files) {
    const original = entries.get(file) as Uint8Array;

    let script: ReturnType<typeof readCompiled>;
    try {
      script = readCompiled(original);
    } catch (error) {
      if (error instanceof BinaryError) {
        unreadable.push(`${file}: ${error.message}`);
        continue;
      }
      throw error;
    }

    const source = writeSourceText(script);
    const recompiled = writeCompiledBytes(readSource(source));
    const regenerated = writeSourceText(readCompiled(recompiled));

    assert.equal(regenerated, source, `${file}: source changed after compile and decompile`);
    if (Buffer.compare(recompiled, original) === 0) {
      identicalToOriginal++;
    }
  }

  t.diagnostic(
    `${files.length} files; ${identicalToOriginal} recompile byte-identical; ${unreadable.length} unreadable`,
  );
  for (const line of unreadable) {
    t.diagnostic(line);
  }
  // e10_000_137 is an untranslated leftover in an older opcode layout (5-byte IfFlag heads, an
  // opcode 0x18, 2-byte SetVariable) that the reader cannot parse; anything beyond it is a regression
  assert.ok(unreadable.length <= 1, `unexpected unreadable files:\n${unreadable.join("\n")}`);
});
