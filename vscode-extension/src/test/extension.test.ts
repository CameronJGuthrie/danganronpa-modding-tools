import * as assert from "assert";
// Import the metadata array from metadata/index.ts to avoid drift
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
    const getVoiceRegex = () => createCompleteFunctionRegex("Voice", 5);

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
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!isInsideQuotes(text, match.index)) {
        matches.push(match[0]);
      }
    }

    // Then - should have no matches after filtering
    assert.equal(matches.length, 0, "Voice inside quotes should not match after filtering");

    // But should match when not in quotes
    const text2 = "Voice(0, 99, 0, 1, 100)";
    const regex2 = getVoiceRegex();
    const matches2 = [];
    let match2;
    while ((match2 = regex2.exec(text2)) !== null) {
      if (!isInsideQuotes(text2, match2.index)) {
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
    assert.deepStrictEqual(getArgumentsFromFunctionLike("IfTrue()"), []);

    // Whitespace-only parentheses should return empty array
    assert.deepStrictEqual(getArgumentsFromFunctionLike("IfTrue( )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("IfTrue(  )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("IfTrue(   )"), []);

    // Hex opcode format with no arguments
    assert.deepStrictEqual(getArgumentsFromFunctionLike("0x3C()"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("0x3C( )"), []);
  });

  test("argument extractor with single argument", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetVar8(12)"), [{ stringIndex: 8, value: 12 }]);

    // With whitespace
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetVar8( 12 )"), [{ stringIndex: 9, value: 12 }]);
  });

  test("argument extractor handles zero values", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Func(0, 0, 0)"), [
      { stringIndex: 5, value: 0 },
      { stringIndex: 8, value: 0 },
      { stringIndex: 11, value: 0 },
    ]);
  });

  test("no duplicate function names or opcodes", () => {
    // Check for duplicate names
    const nameMap = new Map<string, string>();
    for (const meta of metadata) {
      if (nameMap.has(meta.name)) {
        assert.fail(
          `Duplicate function name found: "${meta.name}" (opcode: ${meta.opcode}) ` +
            `conflicts with existing function (opcode: ${nameMap.get(meta.name)})`,
        );
      }
      nameMap.set(meta.name, meta.opcode);
    }

    // Check for duplicate opcodes (skip empty opcodes)
    const opcodeMap = new Map<string, string>();
    for (const meta of metadata) {
      if (meta.opcode === "") {
        assert.fail(`Function "${meta.name}" has an empty opcode. All functions must have a valid opcode.`);
      }

      if (opcodeMap.has(meta.opcode)) {
        assert.fail(
          `Duplicate opcode found: "${meta.opcode}" is used by both ` +
            `"${meta.name}" and "${opcodeMap.get(meta.opcode)}"`,
        );
      }
      opcodeMap.set(meta.opcode, meta.name);
    }

    // If we get here, no duplicates were found
    assert.ok(true, "All function names and opcodes are unique");
  });
});
