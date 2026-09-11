import * as assert from "node:assert";
import { Character, LinscriptInstructionName } from "linscript-definitions";
// Import the metadata record from metadata/index.ts to avoid drift
import { metadata } from "../metadata";
import {
  createCompleteFunctionRegex,
  getArgumentsFromFunctionLike,
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
  });

  test("color text regex", () => {
    // Given
    const getRegex = () => getColorTextRegex();

    // When/ Then
    assert.match(`<CLT 0><CLT>`, getRegex());
    assert.match(`<CLT 2>AAA<CLT>`, getRegex());
    assert.match(`<CLT 3><CLT>`, getRegex());
    assert.match(`<CLT 3><CLT>`, getRegex());
    assert.doesNotMatch(`CLT`, getRegex());
    assert.doesNotMatch(`<CLT>`, getRegex());
    assert.doesNotMatch(`<CLT><CLT>`, getRegex());

    const result = getRegex().exec(`<CLT 0>ABC<CLT>`) as RegExpExecArray;
    assert.equal(result[0], "<CLT 0>ABC<CLT>");
    assert.equal(result[1], "0");
    assert.equal(result[2], "ABC");
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
      if (meta.hexcode === "") {
        assert.fail(`Function "${meta.name}" has an empty opcode. All functions must have a valid opcode.`);
      }

      // AutoText is source-only sugar that compiles to Text, so it legitimately shares Text's opcode.
      if (meta.name === LinscriptInstructionName.AutoText) {
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
