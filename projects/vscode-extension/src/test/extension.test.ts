import * as assert from "node:assert";
import { Character, comparisonOperators, RESET_FLAGS } from "linscript-definitions";
// Import the instructions record from instructions/index.ts to avoid drift
import { spriteArgumentsOfLine, spriteLabel, spriteTextureName } from "../features/sprite-image";
import { cropPngFromFirstVisibleRow, cropPngTop, readPngHeader } from "../util/png-crop";
import { instructions } from "../instructions";
import { scopedNamesFromDocument } from "../util/script-meta";
import {
  createCompleteFunctionRegex,
  createLooseCallRegex,
  createQuoteChecker,
  createVarargsRegex,
  getArgumentsFromFunctionLike,
  getColorTextMatch,
  getColorTextRegex,
  getTextFunctionRegex,
  isInsideQuotes,
} from "../util/string-util";
import { validateCall, validateCallSyntax } from "../util/validate-arguments";

const NO_SCOPED_NAMES = scopedNamesFromDocument("");

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

    assert.match("Sprite(0, 0, 0, 0, 1)", getSpriteRegex());
    assert.match("Sprite(0 , 0, 0, 0, 1 )", getSpriteRegex());
    assert.match("Sprite(0, 0,   0, 0, 1)", getSpriteRegex());
    assert.match("Sprite( 0, 0, 0,   0,  1)", getSpriteRegex());
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

  test("createQuoteChecker agrees with isInsideQuotes at every offset", () => {
    const text = 'Text("a \\"quoted\\" Voice(0)") Voice(1)\nSpeaker(Makoto) Text("Goto(5)")\n"unterminated Goto(1)';
    const isInside = createQuoteChecker(text);
    for (let offset = 0; offset <= text.length; offset++) {
      assert.equal(isInside(offset), isInsideQuotes(text, offset), `offset ${offset}`);
    }
    assert.equal(createQuoteChecker("no quotes here")(5), false);
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
      { text: "0", stringIndex: 6, value: 0 },
      { text: "2", stringIndex: 9, value: 2 },
      { text: "3", stringIndex: 12, value: 3 },
    ]);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Movie(0, 2)"), [
      { text: "0", stringIndex: 6, value: 0 },
      { text: "2", stringIndex: 9, value: 2 },
    ]);
  });

  test("argument extractor with no arguments", () => {
    // Empty parentheses should return empty array
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then()"), []);

    // Whitespace-only parentheses should return empty array
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then( )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then(  )"), []);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Then(   )"), []);
  });

  test("argument extractor with single argument", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetFlag(12)"), [{ text: "12", stringIndex: 8, value: 12 }]);

    // With whitespace
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetFlag( 12 )"), [{ text: "12", stringIndex: 9, value: 12 }]);
  });

  test("argument extractor handles zero values", () => {
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Func(0, 0, 0)"), [
      { text: "0", stringIndex: 5, value: 0 },
      { text: "0", stringIndex: 8, value: 0 },
      { text: "0", stringIndex: 11, value: 0 },
    ]);
  });

  test("named arguments match the call regexes and resolve to their values", () => {
    assert.match("Speaker(Makoto)", createCompleteFunctionRegex("Speaker", 1));
    assert.match("Speaker( Makoto )", createCompleteFunctionRegex("Speaker", 1));
    assert.doesNotMatch("Speaker(Makoto, 1)", createCompleteFunctionRegex("Speaker", 1));
    assert.doesNotMatch('Speaker("Makoto")', createCompleteFunctionRegex("Speaker", 1));

    assert.deepStrictEqual(getArgumentsFromFunctionLike("Speaker(Makoto)", [Character]), [
      { text: "Makoto", stringIndex: 8, value: Character.Makoto },
    ]);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("Speaker(15)", [Character]), [
      { text: "15", stringIndex: 8, value: Character.Monokuma },
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
      instructions.If.decorations?.([0, 1, 5, 7, 8, 2, 9] as never, ""),
      "If Time == 5 Or ScriptEntryContext <= 9",
    );
  });

  test("sprite expressions resolve by the character's own names", () => {
    const names = instructions.Sprite.parameters.map((p) => p.namesBy ?? p.names);
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("Sprite(Monokuma, Curious, FadeIn, Center, 0)", names).map((a) => a.value),
      [15, 10, 1, 2, 0],
    );
    assert.ok(Number.isNaN(getArgumentsFromFunctionLike("Sprite(Makoto, Curious, FadeIn, Center, 0)", names)[1].value));
    assert.deepStrictEqual(spriteArgumentsOfLine("    PlaceSprite(Junko, NeutralQueen, 3)", ""), { character: 16, expression: 0 });
    assert.deepStrictEqual(spriteArgumentsOfLine("Sprite(Taka, 98, Set, Center, 0)", ""), { character: 1, expression: 98 });
    assert.deepStrictEqual(spriteArgumentsOfLine("Sprite(Aoi, Puzzled, FadeIn, Right, 0)", ""), { character: 9, expression: 10 });
    assert.equal(spriteArgumentsOfLine("Speaker(Makoto)", ""), undefined);
    assert.equal(spriteTextureName(16, 3), "stand_16_03.tga");
    assert.equal(spriteLabel(15, 10), "Monokuma: Curious");
  });

  test("cropPngTop keeps the top rows of an RGBA PNG and round-trips their pixels", () => {
    // A 2×3 RGBA image written with every filter type, one per row
    const width = 2;
    const rows = [
      [0, [255, 0, 0, 0, 0, 255, 0, 0]],
      [1, [1, 2, 3, 4, 5, 6, 7, 8]],
      [4, [9, 9, 9, 9, 1, 1, 1, 1]],
    ] as const;
    const zlib = require("node:zlib") as typeof import("node:zlib");
    const raw = Buffer.concat(rows.map(([filter, bytes]) => Buffer.from([filter, ...bytes])));
    const chunk = (type: string, data: Buffer) => {
      const length = Buffer.alloc(4);
      length.writeUInt32BE(data.length);
      const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(zlib.crc32(typed));
      return Buffer.concat([length, typed, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(rows.length, 4);
    ihdr.set([8, 6, 0, 0, 0], 8);
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]);

    const cropped = cropPngTop(png, 2);
    assert.deepStrictEqual(readPngHeader(cropped), { width, height: 2, bitDepth: 8, colourType: 6, interlace: 0 });
    // Decode the crop's pixels: filter 0 rows, so the bytes are the unfiltered pixels
    const idatStart = cropped.indexOf("IDAT", 0, "latin1") + 4;
    const idatLength = cropped.readUInt32BE(idatStart - 8);
    const pixels = zlib.inflateSync(cropped.subarray(idatStart, idatStart + idatLength));
    // Row 0 was filter 0 (none): as written. Row 1 was filter 1 (Sub): each pixel adds the one to its left
    assert.deepStrictEqual([...pixels.subarray(0, 9)], [0, 255, 0, 0, 0, 0, 255, 0, 0]);
    assert.deepStrictEqual([...pixels.subarray(9, 18)], [0, 1, 2, 3, 4, 6, 8, 10, 12]);
    // Cropping taller than the image keeps it whole
    assert.equal(readPngHeader(cropPngTop(png, 10)).height, 3);
    // Row 0 is fully transparent (alpha 0 in both pixels after unfiltering), so a crop from the
    // first visible row starts at row 1
    const head = cropPngFromFirstVisibleRow(png, 1);
    assert.equal(readPngHeader(head).height, 1);
    const headStart = head.indexOf("IDAT", 0, "latin1") + 4;
    const headPixels = zlib.inflateSync(head.subarray(headStart, headStart + head.readUInt32BE(headStart - 8)));
    assert.deepStrictEqual([...headPixels], [0, 1, 2, 3, 4, 6, 8, 10, 12]);
  });

  test("the SetUI mode byte is a menu style after ChooseOption and Hidden/Shown elsewhere", () => {
    const names = instructions.SetUI.parameters.map((p) => p.namesBy ?? p.names);
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("SetUI(ChooseOption, YesNo)", names).map((a) => a.value),
      [18, 3],
    );
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetUI(Textbox, Shown)", names).map((a) => a.value), [1, 1]);
    assert.deepStrictEqual(getArgumentsFromFunctionLike("SetUI(60, Hidden)", names).map((a) => a.value), [60, 0]);
    assert.ok(Number.isNaN(getArgumentsFromFunctionLike("SetUI(Textbox, YesNo)", names)[1].value));
  });

  test("dependent name tables resolve a character offset after a character flag group", () => {
    const setFlagNames = instructions.SetFlag.parameters.map((p) => p.namesBy ?? p.names);
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
    // Flag names from flag-data resolve too, in whichever group declares them
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("SetFlag(System, HandbookEnabled, True)", setFlagNames).map((a) => a.value),
      [0, 4, 1],
    );
    assert.deepStrictEqual(
      getArgumentsFromFunctionLike("SetFlag(MapUnlock, Reset, False)", setFlagNames)[1].value,
      RESET_FLAGS,
    );
    assert.ok(Number.isNaN(getArgumentsFromFunctionLike("SetFlag(System, Floor1, True)", setFlagNames)[1].value));
  });

  test("the Speaker decoration resolves a character name", () => {
    const args = getArgumentsFromFunctionLike(
      "Speaker(Makoto)",
      instructions.Speaker.parameters.map((p) => p.names),
    );
    const decoration = instructions.Speaker.decorations?.(args.map((arg) => arg.value) as [number], "Speaker(Makoto)");
    assert.ok(Array.isArray(decoration));
    assert.strictEqual(decoration[0].contentText, "Speaker: Makoto");
  });

  test("instructions keys match their instruction names", () => {
    for (const [key, meta] of Object.entries(instructions)) {
      assert.strictEqual(meta.name, key, `Instruction registered under "${key}" is named "${meta.name}"`);
    }
  });

  test("validateCall accepts known names and numbers within range", () => {
    assert.deepStrictEqual(validateCall(instructions.Music, "Music(DanganRonpa, 100, 60)", NO_SCOPED_NAMES), []);
    assert.deepStrictEqual(validateCall(instructions.Music, "Music(55, 0, 0)", NO_SCOPED_NAMES), []);
    // The second byte is a fade-out length when the track stops, so the volume range does not apply
    assert.deepStrictEqual(validateCall(instructions.Music, "Music(Stop, 180, 0)", NO_SCOPED_NAMES), []);
    // A slot without a range accepts any number, so unresearched sprite ids are not reported
    assert.deepStrictEqual(
      validateCall(instructions.Sprite, "Sprite(Taka, 6, FadeIn, Center, 0)", NO_SCOPED_NAMES),
      [],
    );
    assert.deepStrictEqual(
      validateCall(instructions.Sprite, "Sprite(Taka, 6, FadeIn, Center, 1)", NO_SCOPED_NAMES),
      [],
    );
    // Placements and Leftmost lineups use higher slots, so the layer range does not apply to them
    assert.deepStrictEqual(validateCall(instructions.Sprite, "Sprite(Taka, 6, Set, 11, 5)", NO_SCOPED_NAMES), []);
    assert.deepStrictEqual(
      validateCall(instructions.Sprite, "Sprite(Taka, 6, FadeOut, Leftmost, 7)", NO_SCOPED_NAMES),
      [],
    );
  });

  test("validateCall reports a shown bust-up in a slot above the two dialogue layers", () => {
    const problems = validateCall(instructions.Sprite, "Sprite(Mukuro, 3, FadeIn, Rightmost, 2)", NO_SCOPED_NAMES);
    assert.strictEqual(problems.length, 1);
    assert.strictEqual(problems[0].stringIndex, "Sprite(Mukuro, 3, FadeIn, Rightmost, ".length);
    assert.match(problems[0].message, /slot 2 is outside the valid range 0 to 1/);
  });

  test("validateCall reports an unknown name", () => {
    const problems = validateCall(instructions.Music, "Music(HappyBirthday, 100, 60)", NO_SCOPED_NAMES);
    assert.strictEqual(problems.length, 1);
    assert.strictEqual(problems[0].stringIndex, "Music(".length);
    assert.strictEqual(problems[0].length, "HappyBirthday".length);
    assert.match(problems[0].message, /Unknown musicId 'HappyBirthday'/);
  });

  test("validateCall reports a number outside the parameter's range", () => {
    const problems = validateCall(instructions.Music, "Music(DanganRonpa, 101, 60)", NO_SCOPED_NAMES);
    assert.strictEqual(problems.length, 1);
    assert.strictEqual(problems[0].stringIndex, "Music(DanganRonpa, ".length);
    assert.match(problems[0].message, /volume 101 is outside the valid range 0 to 100/);
    assert.deepStrictEqual(
      validateCall(instructions.Voice, "Voice(Makoto, Chapter_1, 5, 200)", NO_SCOPED_NAMES).length,
      1,
    );
  });

  test("validateCall resolves names through dependent and document-scoped tables", () => {
    assert.deepStrictEqual(
      validateCall(instructions.SetFlag, "SetFlag(System, HandbookEnabled, True)", NO_SCOPED_NAMES),
      [],
    );
    assert.strictEqual(validateCall(instructions.SetFlag, "SetFlag(System, Nothing, True)", NO_SCOPED_NAMES).length, 1);

    const scoped = scopedNamesFromDocument("Meta()\n  ObjectName(20, Monitor)\n  LabelName(5, HatedGift)\n");
    assert.deepStrictEqual(validateCall(instructions.OnObject, "OnObject(Monitor)", scoped), []);
    assert.strictEqual(validateCall(instructions.OnObject, "OnObject(Door)", scoped).length, 1);
    // A condition's jump is validated as its own Goto call, not as one of the condition's arguments
    assert.deepStrictEqual(
      validateCall(instructions.IfRelationship, "IfRelationship(Sayaka, >, 0, Goto(HatedGift))", scoped),
      [],
    );
    assert.deepStrictEqual(validateCall(instructions.Goto, "Goto(HatedGift)", scoped), []);
    assert.strictEqual(validateCall(instructions.Goto, "Goto(Nowhere)", scoped).length, 1);
    // Meta() entries declare names rather than use them
    assert.deepStrictEqual(validateCall(instructions.ObjectName, "ObjectName(20, Monitor)", scoped), []);
  });

  test("validateCallSyntax reports negative, non-numeric and empty arguments as errors", () => {
    assert.deepStrictEqual(validateCallSyntax(instructions.Music, "Music(DanganRonpa, 100, 60)"), []);
    assert.deepStrictEqual(validateCallSyntax(instructions.Music, "Music( DanganRonpa ,100,60 )"), []);
    // Arithmetic operators are symbols, not negative numbers
    assert.deepStrictEqual(validateCallSyntax(instructions.SetVariable, "SetVariable(Influence, -=, 2000)"), []);
    assert.deepStrictEqual(
      validateCall(instructions.SetVariable, "SetVariable(Influence, -=, 2000)", NO_SCOPED_NAMES),
      [],
    );

    const negative = validateCallSyntax(instructions.Music, "Music(DanganRonpa, -1, 60)");
    assert.strictEqual(negative.length, 1);
    assert.strictEqual(negative[0].severity, "error");
    assert.strictEqual(negative[0].stringIndex, "Music(DanganRonpa, ".length);
    assert.strictEqual(negative[0].length, 2);
    assert.match(negative[0].message, /Negative argument '-1'/);

    assert.match(
      validateCallSyntax(instructions.Music, "Music(DanganRonpa, 1.5, 60)")[0].message,
      /'1.5' is not a number or a name/,
    );
    assert.match(
      validateCallSyntax(instructions.Music, "Music(DanganRonpa, 0x10, 60)")[0].message,
      /'0x10' is not a number/,
    );
    assert.match(validateCallSyntax(instructions.Music, "Music(DanganRonpa, , 60)")[0].message, /Empty argument/);
  });

  test("validateCallSyntax reports the wrong number of arguments", () => {
    assert.match(
      validateCallSyntax(instructions.Music, "Music(DanganRonpa, 100)")[0].message,
      /expects 3 argument\(s\), got 2/,
    );
    assert.match(
      validateCallSyntax(instructions.Voice, "Voice(Makoto, Chapter_1)")[0].message,
      /expects 3 to 4 argument\(s\), got 2/,
    );
    assert.deepStrictEqual(validateCallSyntax(instructions.Voice, "Voice(Makoto, Chapter_1, 5)"), []);
    assert.deepStrictEqual(validateCallSyntax(instructions.StopScript, "StopScript()"), []);
    // Varargs take any count; a condition must still end with its jump
    assert.deepStrictEqual(validateCallSyntax(instructions.If, "If(0, ==, 5, Or, 8, !=, 9, Goto(3))"), []);
    assert.match(validateCallSyntax(instructions.If, "If(0, ==, 5)")[0].message, /must end with its jump/);
    assert.match(validateCallSyntax(instructions.If, "If(0, ==, -5, Goto(3))")[0].message, /Negative argument '-5'/);
  });

  test("the loose call regex matches malformed calls but not other instructions' names", () => {
    // A fresh regex per assertion: a global regex keeps its lastIndex between matches
    assert.match("Music(DanganRonpa, -1, 60)", createLooseCallRegex("Music"));
    assert.match("Music(DanganRonpa, 100)", createLooseCallRegex("Music"));
    assert.match("If(0, ==, -5, Goto(3))", createLooseCallRegex("If"));
    assert.doesNotMatch("OnObject(Monitor)", createLooseCallRegex("ObjectName"));
    assert.doesNotMatch('RawText("hi")', createLooseCallRegex("Text"));
  });
});
