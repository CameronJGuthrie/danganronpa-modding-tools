import * as assert from "node:assert";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { findPakFolders, isPakFolderListing } from "../features/pak-folders";

suite("isPakFolderListing", () => {
  test("accepts entries named by their index, whatever the extension or label", () => {
    assert.strictEqual(isPakFolderListing(["0000.lin", "0001.txt", "0002_NewGame.linscript", "0003"]), true);
  });

  test("rejects an empty folder", () => {
    assert.strictEqual(isPakFolderListing([]), false);
  });

  test("rejects a folder with any entry not named by an index", () => {
    assert.strictEqual(isPakFolderListing(["0000.lin", "e01_005_103.lin"]), false);
    assert.strictEqual(isPakFolderListing(["script_pak_e00"]), false);
  });
});

suite("findPakFolders", () => {
  let dir: string;

  setup(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "pak-folders-"));
  });

  teardown(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("finds index-named folders at any depth regardless of their name", async () => {
    const script = path.join(dir, "Dr1", "data", "us", "script");
    await mkdir(path.join(script, "mtb_s38"), { recursive: true });
    await mkdir(path.join(script, "script_pak_e00", "0005"), { recursive: true });
    await writeFile(path.join(script, "mtb_s38", "0000.txt"), "");
    await writeFile(path.join(script, "script_pak_e00", "0000.lin"), "");
    await writeFile(path.join(script, "script_pak_e00", "0005", "0000.tga"), "");
    await writeFile(path.join(script, "e01_005_103.lin"), "");

    const found = (await findPakFolders(dir)).sort();
    assert.deepStrictEqual(found, [
      path.join(script, "mtb_s38"),
      path.join(script, "script_pak_e00"),
      path.join(script, "script_pak_e00", "0005"),
    ]);
  });
});
