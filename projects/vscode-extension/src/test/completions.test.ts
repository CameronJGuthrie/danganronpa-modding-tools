import * as assert from "node:assert";
import { instructions } from "../instructions";
import { completionsAt, contextAt, isInsideMeta } from "../util/completions";

const META = [
  "Meta()",
  "  ObjectName(20, Monitor)",
  "  LabelName(5, HatedGift)",
  "  SceneFlagName(1, RoomIntroSeen)",
].join("\n");

const META_ENTRIES = ["CharacterName", "LabelName", "ObjectName", "OptionName", "SceneFlagName"];

const labels = (line: string, character = line.length, document = "") =>
  completionsAt(line, character, document).items.map((item) => item.label);

suite("Completions", () => {
  test("a blank line offers every body instruction alphabetically", () => {
    const items = labels("");
    const expected = Object.keys(instructions)
      .filter((name) => !META_ENTRIES.includes(name))
      .sort((a, b) => a.localeCompare(b, "en"));
    assert.deepStrictEqual(items, expected);
    assert.deepStrictEqual(labels("    "), expected);
    assert.ok(items.includes("Meta"));
    assert.ok(items.includes("Option"));
    assert.ok(!items.includes("OptionName"));
    assert.ok(!items.includes("LabelName"));
  });

  test("inside the Meta block only its entries are offered", () => {
    const inside = completionsAt("  ", 2, META, true).items.map((item) => item.label);
    assert.deepStrictEqual(inside, META_ENTRIES);
    const partial = completionsAt("  La", 4, META, true).items.map((item) => item.label);
    assert.deepStrictEqual(partial, META_ENTRIES);
  });

  test("isInsideMeta finds a Meta() line before the cursor", () => {
    const body = `Speaker(Makoto)\n${META}`;
    assert.strictEqual(isInsideMeta(body, 0), false);
    assert.strictEqual(isInsideMeta(body, body.indexOf("Meta()")), false);
    assert.strictEqual(isInsideMeta(body, body.indexOf("  Object")), true);
    assert.strictEqual(isInsideMeta(body, body.length), true);
    assert.strictEqual(isInsideMeta('Text("Meta()")\n', 15), false);
  });

  test("a partly typed name offers instructions and replaces the word", () => {
    const result = completionsAt("Mo", 2, "");
    assert.ok(result.items.some((item) => item.label === "Mode"));
    assert.strictEqual(result.replaceStart, 0);
    assert.strictEqual(result.replaceEnd, 2);
    const mode = result.items.find((item) => item.label === "Mode");
    assert.strictEqual(mode?.snippet, "Mode($0)");
    assert.strictEqual(mode?.retrigger, true);
  });

  test("instruction snippets fit the instruction's shape", () => {
    const items = completionsAt("", 0, "").items;
    const by = (name: string) => items.find((item) => item.label === name);
    assert.strictEqual(by("Return")?.snippet, "Return()");
    assert.strictEqual(by("Text")?.snippet, 'Text("$0")');
    assert.strictEqual(by("Wait")?.snippet, "Wait($0)");
    assert.strictEqual(by("Wait")?.retrigger, false);
  });

  test("renaming an existing call keeps its parentheses", () => {
    const result = completionsAt("Spe(Makoto)", 3, "");
    const speaker = result.items.find((item) => item.label === "Speaker");
    assert.strictEqual(speaker?.snippet, undefined);
    assert.deepStrictEqual([result.replaceStart, result.replaceEnd], [0, 3]);
  });

  test("the first argument offers the slot's enum names", () => {
    const items = labels("Speaker(");
    assert.ok(items.includes("Makoto"));
    assert.ok(items.includes("Sayaka"));
    assert.ok(!items.includes("Speaker"));
    assert.deepStrictEqual(
      items,
      [...items].sort((a, b) => a.localeCompare(b, "en")),
    );
  });

  test("a later argument's table follows an earlier argument", () => {
    assert.ok(labels("SetFlag(System, ").includes("HandbookEnabled"));
    assert.ok(!labels("SetFlag(System, ").includes("True"));
    assert.deepStrictEqual(labels("SetFlag(System, HandbookEnabled, "), ["False", "True"]);
    const partial = completionsAt("SetFlag(System, Hand", 20, "");
    assert.ok(partial.items.some((item) => item.label === "HandbookEnabled"));
    assert.deepStrictEqual([partial.replaceStart, partial.replaceEnd], [16, 20]);
  });

  test("names declared in the Meta block are offered for scoped slots", () => {
    assert.deepStrictEqual(labels("OnObject(", 9, META), ["Monitor"]);
    assert.deepStrictEqual(labels("Goto(", 5, META), ["HatedGift"]);
    assert.ok(labels("SetFlag(SceneFlags, ", 20, META).includes("RoomIntroSeen"));
    assert.ok(labels("SetFlag(SceneFlags, ", 20, META).includes("Reset"));
    assert.deepStrictEqual(labels("Option(", 7, META), ["Exit_1", "Exit_2"]);
  });

  test("a value with a description shows it as detail", () => {
    const stop = completionsAt("Music(", 6, "").items.find((item) => item.label === "Stop");
    assert.ok(stop);
    assert.ok(stop.detail?.startsWith("255"));
  });

  test("conditions offer Goto for their jump and label names inside it", () => {
    const items = labels("IfFlag(System, HandbookEnabled, ==, True, ");
    assert.ok(items.includes("Goto"));
    assert.ok(items.includes("And"));
    assert.deepStrictEqual(labels("IfFlag(System, HandbookEnabled, ==, True, Goto(", undefined, META), ["HatedGift"]);
    assert.ok(labels("IfRelationship(Sayaka, >, 0, ").includes("Goto"));
    assert.ok(labels("If(").includes("Wait"));
  });

  test("varargs conditions repeat their tables", () => {
    assert.ok(labels("IfFlag(System, HandbookEnabled, ==, True, And, ").includes("System"));
    assert.ok(labels("IfFlag(System, HandbookEnabled, ==, True, And, System, ").includes("HandbookEnabled"));
  });

  test("trailing instructions of Text are statements", () => {
    assert.ok(labels('Text("Hello", ').includes("Wait"));
    assert.ok(labels('Text("Hello", SetUI(').includes("Rumble"));
    assert.ok(labels('Text("Hello", SetUI(Rumble, ').includes("Hidden"));
  });

  test("nothing is offered inside strings or comments", () => {
    assert.deepStrictEqual(labels('Text("Hel'), []);
    assert.deepStrictEqual(labels("# Spe"), []);
    assert.deepStrictEqual(labels("Speaker(Makoto) "), []);
    assert.strictEqual(contextAt('Text("a", Wa', 12).kind, "instruction");
    assert.strictEqual(contextAt("Speaker(Mak", 11).kind, "argument");
  });

  test("an unknown instruction's arguments offer nothing", () => {
    assert.deepStrictEqual(labels("Bogus("), []);
  });
});
