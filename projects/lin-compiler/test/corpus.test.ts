import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { BinaryError } from "../src/errors.ts";
import { readCompiled, readSource } from "../src/scriptRead.ts";
import { writeCompiledBytes, writeSourceText } from "../src/scriptWrite.ts";

/** The game's script directory as extracted by `pnpm unpack`. */
const CORPUS_DIR = fileURLToPath(new URL("../../../workspace/modded/dr1_data_us/Dr1/data/us/script", import.meta.url));

test("every game script round-trips through source and back", { skip: !existsSync(CORPUS_DIR) && "corpus not extracted" }, async (t) => {
  const files = (await readdir(CORPUS_DIR)).filter((name) => name.endsWith(".lin")).sort();
  assert.ok(files.length > 0, "corpus directory is empty");

  let identicalToOriginal = 0;
  const unreadable: string[] = [];

  for (const file of files) {
    const original = new Uint8Array(await readFile(join(CORPUS_DIR, file)));

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

  t.diagnostic(`${files.length} files; ${identicalToOriginal} recompile byte-identical; ${unreadable.length} unreadable`);
  for (const line of unreadable) {
    t.diagnostic(line);
  }
  // A handful of shipped scripts contain bytes the reader rejects; anything beyond that is a regression
  assert.ok(unreadable.length <= 2, `unexpected unreadable files:\n${unreadable.join("\n")}`);
});
