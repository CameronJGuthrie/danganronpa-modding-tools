import * as assert from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { listPakEntries, modPakDir } from "../features/scripts";

suite("modPakDir", () => {
  const root = path.join(path.sep, "wb");

  test("mirrors the folder's place under Dr1 into the mod with a pak_ prefix", () => {
    const folder = path.join(path.sep, "x", "all", "dr1_data_us", "Dr1", "data", "us", "script", "script_pak_e00");
    assert.strictEqual(
      modPakDir(root, folder),
      path.join(root, "mod", "dr1_data_us", "Dr1", "data", "us", "script", "pak_script_pak_e00"),
    );
  });

  test("rejects a folder outside Dr1", () => {
    assert.throws(() => modPakDir(root, path.join(path.sep, "x", "script_pak_e00")), /not inside a Dr1 directory/);
  });
});

suite("listPakEntries", () => {
  let dir: string;

  setup(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "pak-entries-"));
  });

  teardown(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("lists index-named .lin and .linscript files in index order, preferring the .linscript", async () => {
    for (const name of ["0010.lin", "0002.lin", "0002.linscript", "0003_Label.lin", "notes.txt", "0004.tga"]) {
      await writeFile(path.join(dir, name), "");
    }
    const entries = await listPakEntries(dir);
    assert.deepStrictEqual(
      entries.map((entry) => [entry.index, path.basename(entry.file)]),
      [
        [2, "0002.linscript"],
        [3, "0003_Label.lin"],
        [10, "0010.lin"],
      ],
    );
  });
});
