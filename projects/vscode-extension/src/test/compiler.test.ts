import * as assert from "node:assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { CompilerClient } from "../features/compiler";

// The bundled worker sits beside the bundled extension: out/compiler-worker.js, one level up from out/test
const WORKER = path.resolve(__dirname, "..", "compiler-worker.js");

suite("Compiler worker", () => {
  let dir: string;
  let client: CompilerClient;

  setup(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "lin-worker-"));
    client = new CompilerClient(WORKER);
  });

  teardown(async () => {
    client.dispose();
    await rm(dir, { recursive: true, force: true });
  });

  test("compiles and decompiles a file off-thread", async () => {
    const source = "StudentRelationship(Sayaka, +=, 2)\n";
    const linscript = path.join(dir, "e00_000_001.linscript");
    const lin = path.join(dir, "e00_000_001.lin");
    const back = path.join(dir, "back.linscript");
    await writeFile(linscript, source, "utf8");

    await client.compileFile(linscript, lin);
    await client.decompileFile(lin, back);

    assert.equal((await readFile(back, "utf8")).replace(/^﻿/, ""), source);
  });

  test("directory conversion reports failures without stopping", async () => {
    await writeFile(path.join(dir, "good.linscript"), "StudentRelationship(Sayaka, +=, 2)\n", "utf8");
    await writeFile(path.join(dir, "bad.linscript"), "NotAnOpcode(1)\n", "utf8");

    const result = await client.compileDirectory(dir);

    assert.deepEqual(
      result.succeeded.map((file) => path.basename(file)),
      ["good.linscript"],
    );
    assert.equal(result.failed.length, 1);
    assert.equal(path.basename(result.failed[0].file), "bad.linscript");
    assert.ok(result.failed[0].message.length > 0);
  });

  test("a bad request rejects with the worker's message", async () => {
    await assert.rejects(client.decompileFile(path.join(dir, "missing.lin"), path.join(dir, "x.linscript")), /ENOENT/);
  });
});
