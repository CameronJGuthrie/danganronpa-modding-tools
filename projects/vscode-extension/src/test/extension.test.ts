import * as assert from "node:assert";
import { Character, comparisonOperators } from "linscript-definitions";
// Import the metadata record from metadata/index.ts to avoid drift
import { metadata } from "../metadata";
import {
  createCompleteFunctionRegex,
  createVarargsRegex,
  getArgumentsFromFunctionLike,
  getColorTextMatch,
  getColorTextRegex,
  getTextFunctionRegex,
  isInsideQuotes,
} from "../util/string-util";

suite("Extension Test Suite", () => {
  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("full parameter function regex", () => {
    // Given
    const getMovieRegex = () => createCompleteFunctionRegex("Movie", 2);
    const getSpriteRegex = () => createCompleteFunctionRegex("Sprite", 5);

    // When/ Then
    assert.match("Movie(1, 0)", getMovieRegex());
    assert.match("Movie(1, 0)  ", getMovieRegex());
    assert.match("Movie(1  ,   0)  ", getMovieRegex());
    assert.doesNotMatch("Movie", getMovieRegex());
    assert.doesNotMatch("Movie(", getMovieRegex());
    assert.doesNotMatch("Movie(1, 2", getMovieRegex());
    assert.doesNotMatch("Movie(1, 2, 3)", getMovieRegex());

    assert.match("Sprite(1, 0, 0, 0, 0)", getSpriteRegex());
    assert.match("Sprite(1 , 0, 0, 0, 0 )", getSpriteRegex());
    assert.match("Sprite(1, 0,   0, 0, 0)", getSpriteRegex());
    assert.match("Sprite( 1, 0, 0,   0,  0)", getSpriteRegex());
  });

  test("isInsideQuotes helper function", () => {
    const text1 = 'Text("Voice(0, 99, 0, 1, 100)")';
    const text2 = "Voice(0, 99, 0, 1, 100)";
    const text3 = 'Text("hello") Voice(0, 99, 0, 1, 100)';

    // Position of "Voice" in text1 (inside quotes)
    const posInQuotes = text1.indexOf("Voice");
    assert.equal(isInsideQuotes(text1, posInQuotes), true, "Voice should be inside quotes");

    // Position of "Voice" in text2 (not inside quotes)
    const posOutsideQuotes = text2.indexOf("Voice");
    assert.equal(isInsideQuotes(text2, posOutsideQuotes), false, "Voice should not be inside quotes");

    // Position of "Voice" in text3 (outside quotes, after a quoted string)
    const posAfterQuotes = text3.indexOf("Voice");
    assert.equal(isInsideQuotes(text3, posAfterQuotes), false, "Voice after quotes should not be inside quotes");
  });

  test("full parameter function regex should not match inside quotes", () => {
    // Given
    const getVoiceRegex = () => createCompleteFunctionRegex("Voice", 5);
    const text = 'Text("Voice(0, 99, 0, 1, 100)")';

    // When
    const regex = getVoiceRegex();
    const matches = [];
    for (const match of text.matchAll(regex)) {
      if (!isInsideQuotes(text, match.index!)) {
        matches.push(match[0]);
      }
    }

    // Then - should have no matches after filtering
    assert.equal(matches.length, 0, "Voice inside quotes should not match after filtering");

    // But should match when not in quotes
    const text2 = "Voice(0, 99, 0, 1, 100)";
    const regex2 = getVoiceRegex();
    const matches2 = [];
    for (const match2 of text2.matchAll(regex2)) {
      if (!isInsideQuotes(text2, match2.index!)) {
        matches2.push(match2[0]);
      }
    }
    assert.equal(matches2.length, 1, "Voice outside quotes should match");
  });

  test("text function regex", () => {
    // Given
    const getRegex = () => getTextFunctionRegex();

    // When/ Then
    assert.match(`Text("")`, getRegex());
    assert.match(`Text("ABC")`, getRegex());
    assert.match(`Text("A B C")`, getRegex());
    assert.doesNotMatch(`Text ("A B C")`, getRegex());

    assert.equal(getRegex().exec(`Text("A B C")`), `Text("A B C")`);
    assert.equal(getRegex().exec(`Text(""A B C"")`), `Text(""A B C"")`);
    const multiLine = `Text("Hello",\n  Wait(10),\n  SetUI(Rumble, Hidden))`;
    assert.equal(getRegex().exec(multiLine)?.[0], multiLine);
  });

  test("color text regex matches role wrappers, flat switches and raw CLT tags", () => {
    const run = (text: string) => {
      const match = getColorTextRegex().exec(text);
      return match === null ? undefined : getColorTextMatch(match);
    };

    assert.deepStrictEqual(run('Text("<thought>Huh?</thought>")'), { styleId: 4, text: "Huh?", openTagLength: 9 });
    assert.deepStrictEqual(run('Text("<cyan>Huh?</cyan>")'), { styleId: 4, text: "Huh?", openTagLength: 6 });
    assert.deepStrictEqual(run('Text("<style 26>Stab!<style 0>")'), { styleId: 26, text: "Stab!", openTagLength: 10 });
    assert.deepStrictEqual(run('Text("<CLT 3>key<CLT>")'), { styleId: 3, text: "key", openTagLength: 7 });
    // An unclosed wrapper runs to the end of the string
    assert.deepStrictEqual(run('Text("<thought>open")'), { styleId: 4, text: "open", openTagLength: 9 });
    // Not a style tag
    assert.strictEqual(run('Text("<(*-*<) ^(*-*)^ (>*-*)>")'), undefined);
    assert.doesNotMatch("CLT", getColorTextRegex());
  });

  test("argument extractor", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Movie(0, 2, 3)"), [
      { stringIndex: 6, value: 0 },
      { stringIndex: 9, value: 2 },
      { stringIndex: 12, value: 3 },
    ]);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Movie(0, 2)"), [
      { stringIndex: 6, value: 0 },
      { stringIndex: 9, value: 2 },
    ]);
  });

  test("argument extractor with no arguments", () => {
    // Empty parentheses should return empty array
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then()"), []);

    // Whitespace-only parentheses should return empty array
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then( )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then(  )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then(   )"), []);

    // Hex opcode format with no arguments
    assert.deepStrictEqual(getArgumentsFromFunctionLike("0x3C()"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("0x3C( )"), []);
  });

  test("argument extractor with single argument", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetFlag(12)"), [{ stringIndex: 8, value: 12 }]);

    // With whitespace
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetFlag( 12 )"), [{ stringIndex: 9, value: 12 }]);
  });

  test("argument extractor handles zero values", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Func(0, 0, 0)"), [
      { stringIndex: 5, value: 0 },
      { stringIndex: 8, value: 0 },
      { stringIndex: 11, value: 0 },
    ]);
  });

  test("named arguments match the call regexes and resolve to their values", () => {
    assert.match("Speaker(Makoto)", createCompleteFunctionRegex("Speaker", 1));
    assert.match("Speaker( Makoto )", createCompleteFunctionRegex("Speaker", 1));
    assert.doesNotMatch("Speaker(Makoto, 1)", createCompleteFunctionRegex("Speaker", 1));
    assert.doesNotMatch('Speaker("Makoto")', createCompleteFunctionRegex("Speaker", 1));

    assert.deepStrictEqual(getArgumentsFromFunctionLike("Speaker(Makoto)", [Character]), [
      { stringIndex: 8, value: Character.Makoto },
    ]);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Speaker(15)", [Character]), [
      { stringIndex: 8, value: Character.Monokuma },
    ]);
    assert.ok(Number.isNaN(getArgumentsFromFunctionLike("Speaker(Nobody)", [Character])[0].value));
    assert.ok(Number.isNaN(getArgumentsFromFunctionLike("Speaker(Makoto)")[0].value));
  });

  test("comparison symbols match the call regexes and resolve through name tables", () => {
    assert.match("If(0, <=, 5)", createVarargsRegex("If"));
    assert.match("If(0, ==, 5, Or, 8, !=, 9)", createVarargsRegex("If"));
    assert.match("IfRelationship(3, <, 20)", createCompleteFunctionRegex("IfRelationship", 3));
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("IfRelationship(3, <, 20)", [undefined, comparisonOperators, undefined]).map(
        (a) => a.value,
      ),
      [3, 4, 20],
    );
    assert.deepStrictEqual(
      metadata.If.decorations?.([0, 1, 5, 7, 8, 2, 9] as never, ""),
      "If Time == 5 Or ScriptEntryContext <= 9",
    );
  });

  test("dependent name tables resolve a character offset after a character flag group", () => {
    const setFlagNames = metadata.SetFlag.parameters.map((p) => p.namesBy ?? p.names);
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("SetFlag(CharacterDead, Celeste, True)", setFlagNames).map((a) => a.value),
      [16, 12, 1],
    );
    // Not a character group, so the same word does not resolve
    assert.ok(
      Number.isNaN(getArgumentsFromFunctionLike("SetFlag(ObjectInvestigated, Celeste, 1)", setFlagNames)[1].value),
    );
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("SetFlag(ObjectInvestigated, 5, 1)", setFlagNames).map((a) => a.value),
      [13, 5, 1],
    );
  });

  test("the Speaker decoration resolves a character name", () => {
    const args = getArgumentsFromFunctionLike(
      "Speaker(Makoto)",
      metadata.Speaker.parameters.map((p) => p.names),
    );
    const decoration = metadata.Speaker.decorations?.(args.map((arg) => arg.value) as [number], "Speaker(Makoto)");
    assert.ok(Array.isArray(decoration));
    assert.strictEqual(decoration[0].contentText, "Speaker: Makoto");
  });

  test("metadata keys match their opcode names and opcodes are unique", () => {
    for (const [key, meta] of Object.entries(metadata)) {
      assert.strictEqual(meta.name, key, `Metadata registered under "${key}" is named "${meta.name}"`);
    }

    // Check for duplicate opcodes (skip empty opcodes)
    const opcodeMap = new Map<string, string>();
    for (const meta of Object.values(metadata)) {
      // Annotations such as Meta and Object have no binary form and so no opcode
      if (meta.annotation) {
        assert.strictEqual(meta.hexcode, "", `Annotation "${meta.name}" must not claim an opcode`);
        continue;
      }
      if (meta.hexcode === "") {
        assert.fail(`Function "${meta.name}" has an empty opcode. All functions must have a valid opcode.`);
      }

      // Sugar such as Text and Wait compiles to another opcode, so it legitimately shares that hexcode.
      if (meta.sugar) {
        continue;
      }

      if (opcodeMap.has(meta.hexcode)) {
        assert.fail(
          `Duplicate opcode found: "${meta.hexcode}" is used by both ` +
            `"${meta.name}" and "${opcodeMap.get(meta.hexcode)}"`,
        );
      }
      opcodeMap.set(meta.hexcode, meta.name);
    }

    // If we get here, no duplicates were found
    assert.ok(true, "All function names and opcodes are unique");
  });
});
