import * as assert from "assert";
import { explorationScriptPath, flatScriptName } from "danganronpa-scripts/src/lib/mod-scripts.ts";

suite("flatScriptName", () => {
  const cases: Array<[string, string | null]> = [
    ["e00_001_000.linscript", "e00_001_000"],
    ["chapter_00/scene_001/e00_001_000.linscript", "e00_001_000"],
    ["chapter_00/e00_001_000_Intro.linscript", "e00_001_000"],
    ["chapter_01/scene_005/103_MakotosRoom.linscript", "e01_005_103"],
    ["chapter_08_despair/scene_007_sayaka/001.linscript", "e08_007_001"],
    ["chapter_08/scene_007-sayaka/001_Intro.linscript", "e08_007_001"],
    ["chapter_081/scene_007/001.linscript", null],
    ["chapter_08/scene_0071/001.linscript", null],
    ["chapter_08/scene_007/extra/001.linscript", null],
    ["chapter_01/scene_001/old.007_Gym.linscript", null],
    ["chapter_01/scene_001/007_Gym.linscript.old", null],
  ];
  for (const [input, expected] of cases) {
    test(`${input} -> ${expected}`, () => {
      assert.strictEqual(flatScriptName(input), expected);
    });
  }
});

suite("explorationScriptPath", () => {
  test("nests the flat name under its chapter and scene", () => {
    assert.strictEqual(explorationScriptPath("e01_005_103"), "chapter_01/scene_005/e01_005_103.linscript");
  });

  test("round-trips through flatScriptName", () => {
    assert.strictEqual(flatScriptName(explorationScriptPath("e08_007_001")), "e08_007_001");
  });

  test("rejects anything that is not a script name", () => {
    assert.throws(() => explorationScriptPath("e01_005_103.linscript"));
  });
});
