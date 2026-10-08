import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Opcode } from "../src/definitions/opcode.definition.ts";
import { BinaryError, SourceError } from "../src/errors.ts";
import { readCompiled } from "../src/io/lin-reader.ts";
import { writeCompiledBytes } from "../src/io/lin-writer.ts";
import { readSource } from "../src/io/linscript-reader.ts";
import { writeSourceText } from "../src/io/linscript-writer.ts";
import { formatStyledText, parseStyledText } from "../src/opcodes/textStyles.ts";

const int32 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(offset, true);

/** Compile source, decompile the result, and return the regenerated source. */
function roundTrip(source: string): string {
  return writeSourceText(readCompiled(writeCompiledBytes(readSource(source))));
}

/** Build a textless `.lin` from raw script-data bytes. */
function textlessFile(scriptData: number[]): Uint8Array {
  const header = [1, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0];
  return Uint8Array.from([...header, ...scriptData]);
}

describe("compile and decompile", () => {
  test("fixed-length opcodes round-trip unchanged", () => {
    const source = "Speaker(Mondo)\nSound(513, 2)\nSetVariable(1, -=, 65535)\nStopScript()\n";
    assert.equal(roundTrip(source), source);
  });

  test("StudentTitleEntry names the student and operation; only ids 0-15 are students", () => {
    const script = readSource(
      "StudentTitleEntry(Sayaka, +=, 1)\nStudentTitleEntry(15, 0, 0)\nStudentTitleEntry(16, 0, 0)\n",
    );
    assert.equal(
      writeSourceText(script),
      "StudentTitleEntry(Sayaka, +=, 1)\nStudentTitleEntry(Monokuma, =, 0)\nStudentTitleEntry(16, =, 0)\n",
    );
    assert.throws(() => readSource("StudentTitleEntry(Junko, +=, 1)\n"), SourceError);
  });

  test("StudentRelationship names the student and operation; the amount is a two-byte value", () => {
    assert.equal(
      roundTrip("StudentRelationship(7, 1, 2)\nStudentRelationship(Taka, =, 20)\n"),
      "StudentRelationship(Sayaka, +=, 2)\nStudentRelationship(Taka, =, 20)\n",
    );
    assert.deepEqual(readSource("StudentRelationship(Sayaka, +=, 2)\n").entries[0], {
      opcode: 0x11,
      args: [7, 1, 0, 2],
    });
    assert.throws(() => readSource("StudentRelationship(Junko, +=, 1)\n"), SourceError);
  });

  test("Sprite names its character, transition and position; only characters with sprites are accepted by name", () => {
    const script = readSource(
      "Sprite(0, Usami, 34, PopIn, Right)\nSprite(0, 17, 1, 1, 2)\nSprite(0, 19, 0, 0, 0)\nSprite(0, Makoto, 0, 11, 11)\n",
    );
    assert.equal(
      writeSourceText(script),
      "Sprite(0, Usami, 34, PopIn, Right)\nSprite(0, AlterEgo, 1, FadeIn, Center)\nPlaceSprite(0, 19, 0)\nSprite(0, Makoto, 0, 11, 11)\n",
    );
    assert.throws(() => readSource("Sprite(0, Headmaster, 0, 0, 1)\n"), SourceError);
    assert.throws(() => readSource("PlaceSprite(0, Headmaster, 0)\n"), SourceError);
    assert.throws(() => readSource("Sprite(0, Makoto, 0, Vanish, 0)\n"), SourceError);
  });

  test("Voice names its character and chapter", () => {
    const script = readSource("Voice(18, 2, 71)\nVoice(Usami, Chapter_99, 2)\nVoice(0, 10, 5)\nVoice(17, 7, 1)\n");
    assert.equal(
      writeSourceText(script),
      "Voice(GenocideJill, Chapter_2, 71)\nVoice(Usami, Chapter_99, 2)\nVoice(Makoto, Chapter_10, 5)\nVoice(17, 7, 1)\n",
    );
    assert.throws(() => readSource("Voice(AlterEgo, Chapter_1, 1)\n"), SourceError);
  });

  test("Text absorbs the instructions between the printed text and its WaitInput", () => {
    const source =
      'Text("Hi\\nthere",\n    Wait(10),\n    SetUI(Rumble, Hidden))\nText("<thought>x</thought>",\n    Music(BeautifulDead, 100, 0))\nText("plain")\n';
    const script = readSource(source);
    assert.deepEqual(
      script.entries.map((entry) => entry.opcode),
      [
        Opcode.RawText,
        Opcode.WaitFrame,
        Opcode.WaitFrame,
        Opcode.SetVariable,
        Opcode.SetUI,
        Opcode.WaitInput,
        Opcode.TextStyle,
        Opcode.RawText,
        Opcode.WaitFrame,
        Opcode.TextStyle,
        Opcode.Music,
        Opcode.WaitInput,
        Opcode.RawText,
        Opcode.WaitFrame,
        Opcode.WaitInput,
      ],
    );
    assert.equal(writeSourceText(script), source);
    assert.equal(writeSourceText(readCompiled(writeCompiledBytes(script))), source);
  });

  test("text without the trailing newline still decompiles to Text", () => {
    // The game's bytes: one WaitFrame for the mid-text newline, none for the missing trailing one
    const script = readSource(
      'TextStyle(23)\nRawText("<CLT 23>a\\nb<CLT> <CLT 3>c<CLT>")\nWaitFrame()\nTextStyle(0)\nTextStyle(3)\nTextStyle(0)\nWaitInput()\n',
    );
    const expected = 'Text("<system>a\\nb</system> <keyword>c</keyword>")\n';
    assert.equal(writeSourceText(script), expected);
    // Recompiling normalises the newline in, and the result is stable
    assert.equal(roundTrip(expected), expected);
    // A trailing newline the sugar cannot reproduce still falls back to RawText
    assert.equal(
      writeSourceText(readSource('RawText("a<CLT>\\n<CLT>")\nWaitFrame()\nTextStyle(0)\nTextStyle(0)\nWaitInput()\n')),
      'RawText("a<style 0>\\n<style 0>")\nWaitFrame()\nTextStyle(0)\nTextStyle(0)\nWaitInput()\n',
    );
  });

  test("a WaitFrame count that differs from the newlines still collapses to Text", () => {
    // Two newlines, one WaitFrame: recompiling emits two
    const source = 'RawText("a\\nb\\n")\nWaitFrame()\nWait(10)\nSetUI(Rumble, Hidden)\nWaitInput()\n';
    const expected = 'Text("a\\nb",\n    Wait(10),\n    SetUI(Rumble, Hidden))\n';
    assert.equal(writeSourceText(readSource(source)), expected);
    assert.equal(roundTrip(expected), expected);
    assert.equal(readSource(expected).entries.filter((e) => e.opcode === Opcode.WaitFrame).length, 2);
    // A WaitFrame after a trailing instruction is not the sugar's shape
    const late = 'RawText("a")\nSetUI(Rumble, Shown)\nWaitFrame()\nWaitInput()\n';
    assert.equal(writeSourceText(readSource(late)), late);
  });

  test("Text may spread its trailing instructions over several lines", () => {
    const multiLine =
      'Text("Hi",\n    Wait(10),\n    # a comment inside is ignored\n    SetUI(Rumble, Hidden))\nSpeaker(Makoto)\n';
    const script = readSource(multiLine);
    assert.equal(writeSourceText(script), 'Text("Hi",\n    Wait(10),\n    SetUI(Rumble, Hidden))\nSpeaker(Makoto)\n');
    // A closing paren inside the string does not end the statement
    assert.equal(
      writeSourceText(readSource('Text("a)",\n    Wait(1))\n')),
      writeSourceText(readSource('Text("a)", Wait(1))\n')),
    );
    // Errors in a continued statement point at its first line
    assert.throws(
      () => readSource('Speaker(Makoto)\nText("a",\n    Goto(1))\n'),
      (error: SourceError) => error.line === 2,
    );
    assert.throws(
      () => readSource('Text("a",\n    Wait(1)\n'),
      (error: SourceError) => error.line === 1,
    );
    // Any statement continues while its parentheses stay open; a stray close paren is still an error
    assert.deepEqual(readSource("Speaker(Makoto\n)\n").entries, readSource("Speaker(Makoto)\n").entries);
    assert.throws(() => readSource("Speaker(Makoto))\n"), SourceError);
  });

  test("Text refuses trailing instructions the sugar cannot absorb", () => {
    assert.throws(() => readSource('Text("a", Goto(1))\n'), SourceError);
    assert.throws(() => readSource('Text("a", Text("b"))\n'), SourceError);
    assert.throws(() => readSource('Text("a", OnObject(1))\n'), SourceError);
    assert.throws(() => readSource('Text("a", WaitInput())\n'), SourceError);
    assert.throws(() => readSource('Text("a" Wait(1))\n'), SourceError);
    assert.throws(() => readSource('Text("a", Wait(1)\n'), SourceError);
  });

  test("a text group with a control-flow entry before its WaitInput stays RawText", () => {
    const script = readSource(
      'RawText("one\\n")\nWaitFrame()\nWaitFrame()\nWaitInput()\nRawText("two\\n")\nGoto(1)\nWaitInput()\n',
    );
    // The extra WaitFrame is tolerated; the Goto is not
    assert.equal(writeSourceText(script), 'Text("one")\nRawText("two\\n")\nGoto(1)\nWaitInput()\n');
  });

  test("OptionName(n, label) stands for SetOption plus its RawText label and WaitFrame", () => {
    const source = 'Option(1, "Yes")\n    Goto(5)\nOption(2, "No")\n    Goto(6)\nSetOption(Exit_1)\nSetOption(255)\n';
    const script = readSource(
      'Option(1, "Yes")\n    Goto(5)\nOption(2, "No")\n    Goto(6)\nSetOption(18)\nSetOption(255)\n',
    );
    assert.deepEqual(
      script.entries.map((entry) => [entry.opcode, ...entry.args]),
      [
        [Opcode.SetOption, 1],
        [Opcode.RawText, 0, 0],
        [Opcode.WaitFrame],
        [Opcode.Goto, 0, 5],
        [Opcode.SetOption, 2],
        [Opcode.RawText, 0, 0],
        [Opcode.WaitFrame],
        [Opcode.Goto, 0, 6],
        [Opcode.SetOption, 18],
        [Opcode.SetOption, 255],
      ],
    );
    assert.ok("text" in script.entries[1]);
    assert.equal(script.entries[1].text, "Yes\n");
    assert.equal(writeSourceText(script), source);
    assert.equal(writeSourceText(readCompiled(writeCompiledBytes(script))), source);
    assert.throws(() => readSource("Option(1)\n"), SourceError);
    assert.throws(() => readSource("Option(1, 2)\n"), SourceError);
  });

  test("a SetOption whose label does not follow directly stays plain", () => {
    const source =
      'SetOption(1)\n    Speaker(Makoto)\n    RawText("Yes\\n")\n    WaitFrame()\nSetOption(2)\n    RawText("No")\n    WaitFrame()\n';
    assert.equal(writeSourceText(readSource(source)), source);
  });

  test("an omitted volume compiles to 100 and a volume of 100 decompiles to nothing", () => {
    const script = readSource(
      "Voice(Makoto, Chapter_1, 5)\nVoice(Makoto, Chapter_1, 5, 100)\nSound(7)\nSoundB(3, 100)\n",
    );
    assert.deepEqual(
      script.entries.map((entry) => entry.args),
      [
        [0, 1, 0, 5, 100],
        [0, 1, 0, 5, 100],
        [0, 7, 100],
        [3, 100],
      ],
    );
    assert.equal(
      writeSourceText(script),
      "Voice(Makoto, Chapter_1, 5)\nVoice(Makoto, Chapter_1, 5)\nSound(7)\nSoundB(3)\n",
    );
  });

  test("a volume other than 100 round-trips explicitly", () => {
    const script = readSource("Sound(7, 80)\nVoice(Makoto, Chapter_1, 5, 0)\nSoundB(3, 50)\n");
    assert.deepEqual(
      script.entries.map((entry) => entry.args),
      [
        [0, 7, 80],
        [0, 1, 0, 5, 0],
        [3, 50],
      ],
    );
    assert.equal(writeSourceText(script), "Sound(7, 80)\nVoice(Makoto, Chapter_1, 5, 0)\nSoundB(3, 50)\n");
    assert.throws(() => readSource("Sound(7, 80, 1)\n"), SourceError);
    assert.throws(() => readSource("Sound()\n"), SourceError);
  });

  test("If names the variable it tests but keeps the compared value numeric", () => {
    const script = readSource(
      "If(20, !=, 21, Goto(1))\nIf(Scene, !=, 16, Or, 20, !=, 17, Goto(2))\nIf(49, !=, 0, Goto(3))\n",
    );
    assert.equal(
      writeSourceText(script),
      "If(Scene, !=, 21,\n    Goto(1))\nIf(Scene, !=, 16, Or, Scene, !=, 17,\n    Goto(2))\nIf(49, !=, 0,\n    Goto(3))\n",
    );
    assert.throws(() => readSource("If(Scene, !=, MonocoinPickup, Goto(1))\n"), SourceError);
  });

  test("SetVariable names the variable and the operation", () => {
    const script = readSource(
      "SetVariable(20, 0, 3)\nSetVariable(MonocoinPickup, +=, 5)\nSetVariable(14, 0, 0)\nSetVariable(49, 0, 0)\n",
    );
    assert.equal(
      writeSourceText(script),
      "SetVariable(Scene, =, 3)\nSetVariable(MonocoinPickup, +=, 5)\nSetVariable(Random, =, 0)\nSetVariable(49, =, 0)\n",
    );
    assert.throws(() => readSource("SetVariable(Scene, =, MonocoinPickup)\n"), SourceError);
  });

  test("textless and text scripts get the right header", () => {
    const textless = writeCompiledBytes(readSource("Speaker(1)\n"));
    assert.equal(int32(textless, 0), 1);
    assert.equal(int32(textless, 4), 12);
    assert.equal(int32(textless, 8), textless.length);

    const text = writeCompiledBytes(readSource('Text("hi")\n'));
    assert.equal(int32(text, 0), 2);
    assert.equal(int32(text, 4), 16);
    assert.equal(int32(text, 12), text.length);
  });

  test("Type entries in source are replaced by a synthesised one", () => {
    const script = readSource('Type(Textless)\nText("a")\nText("b")\n');
    const bytes = writeCompiledBytes(script);
    // Type record follows the 16-byte header: marker, opcode, count as UInt16LE
    assert.deepEqual([...bytes.subarray(16, 20)], [0x70, 0x00, 2, 0]);
    assert.equal(int32(bytes, 0), 2);
  });

  test("text escapes survive a round trip", () => {
    const source = 'Text("say \\"hi\\"\\nnext\\\\line")\nSpeaker(Taka)\n';
    assert.equal(roundTrip(source), source);
    const [entry] = readSource(source).entries;
    assert.ok("text" in entry);
    assert.equal(entry.text, 'say "hi"\nnext\\line\n');
  });

  test("If chains round-trip through big-endian packing", () => {
    // Followed by another opcode so the variadic If does not absorb the alignment padding
    // The joiner and second operator bytes are deliberately invalid, so they stay numeric
    const source = "If(258, ==, 772, 5, 1, 9, 2,\n    Goto(1))\nSpeaker(Taka)\n";
    const entry = readSource(source).entries[0];
    assert.deepEqual(entry.args, [1, 2, 1, 3, 4, 5, 0, 1, 9, 0, 2]);
    assert.equal(roundTrip(source), source);
  });

  test("an opcode outside the table has no source form and is a decompile error", () => {
    const bytes = textlessFile([0x70, 0x07, 9, 8, 0x70, 0x21, 1]);
    assert.throws(() => writeSourceText(readCompiled(bytes)), /unknown opcode 0x07 with 2 argument byte/);
    // Nor can source spell an opcode by number
    assert.throws(() => readSource("0x21(4)\n"), /unknown opcode '0x21'/);
  });
});

describe("Text sugar", () => {
  test("newlines expand to WaitFrame and the group ends with WaitInput", () => {
    const { entries } = readSource('Text("one\\ntwo\\nthree")');
    assert.deepEqual(
      entries.map((e) => e.opcode),
      // Three explicit-or-implicit newlines: two in the text plus the implicit trailing one
      [Opcode.RawText, Opcode.WaitFrame, Opcode.WaitFrame, Opcode.WaitFrame, Opcode.WaitInput],
    );
  });

  test("the text gains an implicit trailing newline", () => {
    const [entry] = readSource('Text("hi")').entries;
    assert.ok("text" in entry);
    assert.equal(entry.text, "hi\n");
  });

  test("the implicit newline goes before closing style tags", () => {
    const [, entry] = readSource('Text("<thought>hi</thought>")').entries;
    assert.ok("text" in entry);
    assert.equal(entry.text, "<CLT 4>hi\n<CLT>");
    // Text that opens plain has no TextStyle ahead of it, so the text entry comes first
    const [keyword, style] = readSource('Text("say <keyword>hi</keyword>")').entries;
    assert.ok("text" in keyword);
    assert.equal(keyword.text, "say <CLT 3>hi\n<CLT>");
    assert.deepEqual([style.opcode, ...style.args], [Opcode.TextStyle, 3]);
  });

  test("CLT colour tags expand to TextStyle opcodes", () => {
    const { entries } = readSource('Text("<keyword>red</keyword> plain <style 5>blue")');
    assert.deepEqual(
      entries.map((e) => [e.opcode, ...e.args]),
      [
        [Opcode.TextStyle, 3],
        [Opcode.RawText, 0, 0],
        [Opcode.TextStyle, 0],
        [Opcode.TextStyle, 5],
        [Opcode.WaitFrame],
        [Opcode.WaitInput],
      ],
    );
  });

  test("expanded groups collapse back to Text on decompile", () => {
    for (const source of [
      'Text("one\\ntwo")\n',
      'Text("<keyword>red</keyword> plain")\n',
      'Text("a\\n<style 2>b")\n',
      'Text("<thought>hi</thought>")\n',
      // An explicit trailing newline is a blank line and survives on top of the implicit one
      'Text("hi\\n")\n',
    ]) {
      assert.equal(roundTrip(source), source);
    }
  });

  test("a text entry without the trailing newline collapses to Text and gains the newline", () => {
    assert.equal(writeSourceText(readSource('RawText("*Ding dong*")\nWaitInput()\n')), 'Text("*Ding dong*")\n');
    assert.equal(
      writeSourceText(
        readSource('TextStyle(23)\nRawText("<system>*Ding dong*</system>")\nTextStyle(0)\nWaitInput()\n'),
      ),
      'Text("<system>*Ding dong*</system>")\n',
    );
    // A newline between closing tags is not where the sugar would put it, so the bytes stay raw
    const between =
      'TextStyle(4)\nRawText("<style 4>a<style 0>\\n<style 0>")\nTextStyle(0)\nWaitFrame()\nTextStyle(0)\nWaitInput()\n';
    assert.equal(roundTrip(between), between);
  });

  test("a text entry not closed by WaitInput is written as RawText", () => {
    const source = 'RawText("hi\\n")\nWaitFrame()\nSpeaker(Taka)\n';
    assert.equal(roundTrip(source), source);
    // A menu label written the long way collapses to the Option sugar on decompile
    const option = 'SetOption(1)\n    RawText("Yes\\n")\n    WaitFrame()\n    Goto(1)\nSetOption(255)\n';
    assert.equal(roundTrip(option), 'Option(1, "Yes")\n    Goto(1)\nSetOption(255)\n');
  });

  test("RawText compiles to exactly one entry with no implicit newline", () => {
    assert.deepEqual(readSource('RawText("hi\\n")\n').entries, [{ opcode: 0x02, args: [0, 0], text: "hi\n" }]);
    assert.deepEqual(
      readSource('Text("hi")\n').entries.map((e) => e.opcode),
      [Opcode.RawText, Opcode.WaitFrame, Opcode.WaitInput],
    );
  });
});

describe("Meta block", () => {
  const source = [
    "OnObject(Monitor)",
    "    ObjectState(Camera, Visible, Interactable)",
    "OnObject(254)",
    "    Speaker(Makoto)",
    "OnObject(255)",
    "",
    "Meta()",
    "    ObjectName(20, Monitor)",
    "    ObjectName(21, Camera)",
    "",
  ].join("\n");

  test("object names resolve to their ids and survive a source round trip", () => {
    const script = readSource(source);
    assert.deepEqual(script.meta, {
      objects: { 20: "Monitor", 21: "Camera" },
      characters: {},
      options: {},
      labels: {},
      sceneFlags: {},
    });
    assert.deepEqual(
      script.entries.map((e) => [e.opcode, ...e.args]),
      [
        [Opcode.OnObject, 20],
        [Opcode.ObjectState, 21, 1, 0, 0, 0],
        [Opcode.OnObject, 254],
        [Opcode.Speaker, 0],
        [Opcode.OnObject, 255],
      ],
    );
    assert.equal(writeSourceText(script), source);
  });

  test("CharacterName(id, Name) names OnCharacter slots separately from object ids", () => {
    const source =
      "OnCharacter(Sayaka)\n    Goto(1)\nOnCharacter(3)\nOnCharacter(255)\nOnObject(Sayaka_Seat)\nOnObject(255)\n\nMeta()\n    ObjectName(0, Sayaka_Seat)\n    CharacterName(0, Sayaka)\n";
    const script = readSource(source);
    assert.deepEqual(script.meta, {
      objects: { 0: "Sayaka_Seat" },
      characters: { 0: "Sayaka" },
      options: {},
      labels: {},
      sceneFlags: {},
    });
    assert.deepEqual(
      script.entries.filter((entry) => entry.opcode === Opcode.OnCharacter).map((entry) => entry.args),
      [[0], [3], [255]],
    );
    assert.equal(writeSourceText(script), source);
    assert.equal(
      roundTrip(source),
      source
        .slice(0, source.indexOf("\n\nMeta()"))
        .replace("OnCharacter(Sayaka)", "OnCharacter(0)")
        .replace("OnObject(Sayaka_Seat)", "OnObject(0)") + "\n",
    );
  });

  test("numbers are accepted for named objects and unnamed ids stay numeric", () => {
    const script = readSource("OnObject(20)\nOnObject(22)\nMeta()\n    ObjectName(20, Monitor)\n");
    assert.equal(writeSourceText(script), "OnObject(Monitor)\nOnObject(22)\n\nMeta()\n    ObjectName(20, Monitor)\n");
  });

  test("the block is dropped by the binary", () => {
    const script = readSource(source);
    assert.equal(readCompiled(writeCompiledBytes(script)).meta, undefined);
    assert.equal(
      writeSourceText(readCompiled(writeCompiledBytes(script))),
      source
        .replace(/\n\nMeta.*$/s, "\n")
        .replace("Monitor", "20")
        .replace("Camera", "21"),
    );
  });

  test("exit option ids have default names and Meta() names the choices or overrides a default", () => {
    const source =
      'Option(Yes, "Sure")\n    Goto(1)\nOption(No, "Nope")\n    Goto(2)\nOption(Leave, "Leave")\n    Goto(3)\nSetOption(Exit_1)\nSetOption(Exit_2)\nSetOption(255)\n\nMeta()\n    OptionName(1, Yes)\n    OptionName(2, No)\n    OptionName(3, Leave)\n';
    const script = readSource(source);
    assert.deepEqual(script.meta, {
      objects: {},
      characters: {},
      options: { 1: "Yes", 2: "No", 3: "Leave" },
      labels: {},
      sceneFlags: {},
    });
    assert.deepEqual(
      script.entries.filter((e) => e.opcode === Opcode.SetOption).map((e) => e.args[0]),
      [1, 2, 3, 18, 19, 255],
    );
    assert.equal(writeSourceText(script), source);
    // Without a Meta block only the exit defaults apply; 1 and 2 are not named Yes/No everywhere
    assert.equal(
      writeSourceText(readSource("SetOption(1)\nSetOption(3)\nSetOption(18)\n")),
      "SetOption(1)\nSetOption(3)\nSetOption(Exit_1)\n",
    );
    assert.throws(() => readSource("SetOption(Yes)\n"), /unknown name 'Yes'/);
    assert.equal(
      writeSourceText(readSource("SetOption(18)\nMeta()\n    OptionName(18, Back)\n")),
      "SetOption(Back)\n\nMeta()\n    OptionName(18, Back)\n",
    );
    assert.equal(
      writeSourceText(readSource("SetOption(2)\nMeta()\n    OptionName(2, Decline)\n")),
      "SetOption(Decline)\n\nMeta()\n    OptionName(2, Decline)\n",
    );
  });

  test("LabelName() in Meta() names a jump label for Label and Goto", () => {
    const source =
      "Label(HatedGift)\nGoto(HatedGift)\nGoto(7)\n\nMeta()\n    LabelName(5, HatedGift)\n    LabelName(300, Later)\n";
    const script = readSource(source);
    assert.deepEqual(script.meta, {
      objects: {},
      characters: {},
      options: {},
      labels: { 5: "HatedGift", 300: "Later" },
      sceneFlags: {},
    });
    assert.deepEqual(script.entries.slice(0, 3), [
      { opcode: Opcode.Label, args: [0, 5] },
      { opcode: Opcode.Goto, args: [0, 5] },
      { opcode: Opcode.Goto, args: [0, 7] },
    ]);
    assert.equal(writeSourceText(script), source);
    // Label ids are 16-bit, so names may cover addresses a byte id cannot
    assert.deepEqual(readSource("Goto(Far)\nMeta()\n    LabelName(65535, Far)\n").entries, [
      { opcode: Opcode.Goto, args: [255, 255] },
    ]);
    assert.throws(() => readSource("Meta()\n    LabelName(65536, Far)\n"), /0 to 65535/);
    assert.throws(() => readSource("Goto(Missing)\n"), /unknown name 'Missing'/);
    assert.equal(roundTrip(source), "Label(5)\nGoto(5)\nGoto(7)\n");
  });

  test("a script without a Meta block reads without meta and writes none", () => {
    const script = readSource("OnObject(20)\n");
    assert.equal(script.meta, undefined);
    assert.equal(writeSourceText(script), "OnObject(20)\n");
  });

  test("malformed blocks are rejected with the offending line", () => {
    const cases: [string, RegExp][] = [
      ["OnObject(Monitor)\n", /unknown name 'Monitor'/],
      [
        "Meta()\n    Speaker(Makoto)\n",
        /only ObjectName\(id, Name\), CharacterName\(id, Name\), OptionName\(id, Name\), LabelName\(id, Name\), SceneFlagName\(id, Name\) entries/,
      ],
      ["OnCharacter(Sayaka)\n", /unknown name 'Sayaka'/],
      ["Meta()\n    CharacterName(0, Sayaka)\n    CharacterName(1, Sayaka)\n", /already used/],
      ["Meta()\n    OptionName(3, Exit_1)\n", /already used by default option 18/],
      ["Meta()\n    OptionName(3, Leave)\n    OptionName(4, Leave)\n", /already used/],
      ["SetOption(Leave)\n", /unknown name 'Leave'/],
      ["Meta()\n    ObjectName(20)\n", /expects 2 arguments/],
      ["Meta()\n    ObjectName(255, Close)\n", /0 to 254/],
      ["Meta()\n    ObjectName(20, 12)\n", /must be an identifier/],
      ["Meta()\n    ObjectName(20, A)\n    ObjectName(20, B)\n", /already named 'A'/],
      ["Meta()\n    ObjectName(20, A)\n    ObjectName(21, A)\n", /already used/],
      ["Meta(1)\n", /takes no arguments/],
    ];
    for (const [text, message] of cases) {
      assert.throws(() => readSource(text), message, text);
    }
    assert.throws(
      () => readSource("Speaker(Makoto)\nMeta()\n    ObjectName(20, A)\n    ObjectName(x, B)\n"),
      (error: unknown) => {
        assert.ok(error instanceof SourceError);
        assert.equal(error.line, 4);
        return true;
      },
    );
  });
});

describe("named arguments", () => {
  test("a Speaker id is written as the character's name", () => {
    const bytes = textlessFile([0x70, 0x21, 0, 0x70, 0x21, 15]);
    assert.equal(writeSourceText(readCompiled(bytes)), "Speaker(Makoto)\nSpeaker(Monokuma)\n");
  });

  test("names and numbers compile to the same byte", () => {
    assert.deepEqual(readSource("Speaker(Makoto)\n").entries[0], { opcode: 0x21, args: [0] });
    assert.deepEqual(readSource("Speaker(0)\n").entries[0], { opcode: 0x21, args: [0] });
    assert.equal(roundTrip("Speaker(0)\n"), "Speaker(Makoto)\n");
  });

  test("ids without a name stay numeric", () => {
    assert.equal(roundTrip("Speaker(99)\n"), "Speaker(99)\n");
  });

  test("Music tracks are written by title, with _2 for a repeated title, and Stop for 255", () => {
    assert.equal(
      roundTrip("Music(6, 100, 0)\nMusic(9, 100, 60)\nMusic(28, 100, 60)\nMusic(255, 0, 0)\nMusic(39, 100, 0)\n"),
      "Music(WeeklyDespairMagazine, 100, 0)\nMusic(GoodbyeDespairSchool, 100, 60)\nMusic(GoodbyeDespairSchool_2, 100, 60)\nMusic(Stop, 0, 0)\nMusic(39, 100, 0)\n",
    );
    assert.deepEqual(readSource("Music(WeeklyDespairMagazine, 100, 0)\n").entries[0], {
      opcode: 0x09,
      args: [6, 100, 0],
    });
  });

  test("room ids are written by Room name in LoadMap, MapCharacter and story-chapter script calls", () => {
    assert.equal(
      roundTrip("LoadMap(101, 1, 255)\nLoadMap(248, 1, 255)\nMapCharacter(136, 3, True)\nMapCharacter(54, 3, False)\n"),
      "LoadMap(DormHallway, 1, 255)\nLoadMap(248, 1, 255)\nMapCharacter(Kitchen, Mondo, True)\nMapCharacter(54, Mondo, False)\n",
    );
    // The third argument is a room only when the chapter is a story chapter; Free Time (8) and
    // School Mode (9) use it as an index, and the scene-entry script 0 has no room name
    assert.equal(
      roundTrip(
        "LoadScript(1, 9, 103)\nLoadScript(1, 9, 0)\nLoadScript(8, 2, 103)\nRunScript(3, 12, 1)\nRunScript(9, 90, 1)\n",
      ),
      "LoadScript(1, 9, MakotosRoom)\nLoadScript(1, 9, 0)\nLoadScript(8, 2, 103)\nRunScript(3, 12, Hallway1F)\nRunScript(9, 90, 1)\n",
    );
    assert.deepEqual(readSource("LoadScript(1, 9, MakotosRoom)\nMapCharacter(Kitchen, Mondo, True)\n").entries, [
      { opcode: 0x19, args: [1, 9, 103] },
      { opcode: 0x01, args: [136, 3, 1] },
    ]);
    assert.throws(() => readSource("LoadScript(8, 2, MakotosRoom)\n"), /MakotosRoom/);
  });

  test("SetUI names both arguments and leaves unknown ids and modes numeric", () => {
    assert.equal(
      roundTrip("SetUI(1, 0)\nSetUI(1, 1)\nSetUI(18, 3)\nSetUI(60, 1)\n"),
      "SetUI(Textbox, Hidden)\nSetUI(Textbox, Shown)\nSetUI(ChooseOption, 3)\nSetUI(60, Shown)\n",
    );
    assert.deepEqual(readSource("SetUI(Textbox, Shown)\n").entries[0], { opcode: 0x25, args: [1, 1] });
    assert.deepEqual(readSource("SetUI(1, 1)\n").entries[0], { opcode: 0x25, args: [1, 1] });
  });

  test("If conditions use comparison symbols and And/Or joiners", () => {
    // Trailing Speaker keeps the variadic If from absorbing the alignment padding
    assert.equal(
      roundTrip("If(0, 0, 5, Goto(1))\nIf(0, 1, 5, 6, 8, 2, 9, 7, 8, 3, 9, Goto(2))\nSpeaker(Taka)\n"),
      "If(Time, !=, 5,\n    Goto(1))\nIf(Time, ==, 5, And, ScriptEntryContext, <=, 9, Or, ScriptEntryContext, >=, 9,\n    Goto(2))\nSpeaker(Taka)\n",
    );
    assert.equal(
      roundTrip(
        "IfRelationship(3, 4, 20, Goto(1))\nIfRelationship(Sayaka, >, 0, Goto(2))\nIfFreeTimeEvent(3, 5, 0, Goto(3))\nIfFreeTimeEvent(Sayaka, !=, 2, Goto(4))\n",
      ),
      "IfRelationship(Mondo, <, 20,\n    Goto(1))\nIfRelationship(Sayaka, >, 0,\n    Goto(2))\nIfFreeTimeEvent(Mondo, >, 0,\n    Goto(3))\nIfFreeTimeEvent(Sayaka, !=, 2,\n    Goto(4))\n",
    );
    // Bare = is accepted for ==, and numbers still work everywhere
    assert.deepEqual(readSource("If(0, =, 5, Goto(1))\n").entries[0].args, [0, 0, 1, 0, 5]);
    assert.deepEqual(readSource("If(0, 1, 5, Goto(1))\n").entries[0].args, [0, 0, 1, 0, 5]);
    assert.throws(() => readSource("If(0, <>, 5, Goto(1))\n"), /invalid Byte argument '<>'/);
  });

  test("a condition carries its Then and Goto as a trailing Goto(label) argument", () => {
    const script = readSource("IfRelationship(Sayaka, >, 0, Goto(HatedGift))\nMeta()\n    LabelName(5, HatedGift)\n");
    assert.deepEqual(script.entries, [
      { opcode: Opcode.IfRelationship, args: [0, 7, 5, 0, 0] },
      { opcode: Opcode.Then, args: [] },
      { opcode: Opcode.Goto, args: [0, 5] },
    ]);
    assert.equal(
      writeSourceText(script),
      "IfRelationship(Sayaka, >, 0,\n    Goto(HatedGift))\n\nMeta()\n    LabelName(5, HatedGift)\n",
    );
    // The form is mandatory: no bare condition, no separate Then, and no other body in the binary
    assert.throws(() => readSource("IfRelationship(Sayaka, >, 0)\n"), /must end with its branch/);
    assert.throws(() => readSource("IfRelationship(Sayaka, >, 0, Goto(1), Goto(2))\n"), /expects 3 argument/);
    assert.throws(() => readSource("Then()\n"), /not a source instruction/);
    assert.throws(() => readSource("If(Time, ==, 0, Goto())\n"), /Goto expects 1 argument/);
    const condition = { opcode: Opcode.If, args: [0, 0, 1, 0, 5] };
    const then = { opcode: Opcode.Then, args: [] };
    assert.throws(() => writeSourceText({ entries: [condition, then] }), /not followed by Goto/);
    assert.throws(
      () => writeSourceText({ entries: [condition, { opcode: Opcode.Speaker, args: [0] }] }),
      /not followed by Then/,
    );
    assert.throws(() => writeSourceText({ entries: [then] }), /Then without a preceding condition/);
  });

  test("a branch inside a block indents its Goto one level deeper than the condition", () => {
    const source = "SetOption(1)\n    If(Time, ==, 5,\n        Goto(2))\nSetOption(255)\n";
    assert.equal(writeSourceText(readSource(source)), source);
    assert.equal(roundTrip(source), source);
    assert.deepEqual(
      readSource("If(Time, ==, 5,\n  Goto(2))\n").entries,
      readSource("If(Time, ==, 5, Goto(2))\n").entries,
    );
    assert.throws(() => readSource("If(Time, ==, 5,\n"), /unterminated statement/);
  });

  test("flag groups are named and known offsets become flag, character or skill names", () => {
    assert.equal(
      roundTrip("SetFlag(15, 0, 1)\nSetFlag(16, 12, 1)\nSetFlag(13, 5, 1)\nSetFlag(15, 32, 0)\nSetFlag(90, 0, 1)\n"),
      "SetFlag(SceneFlags, 0, True)\nSetFlag(CharacterDead, Celeste, True)\nSetFlag(ObjectInvestigated, 5, True)\nSetFlag(SceneFlags, Reset, False)\nSetFlag(90, 0, True)\n",
    );
    assert.equal(
      roundTrip("SetFlag(0, 4, 1)\nSetFlag(0, 2, 0)\nSetFlag(1, 32, 0)\nSetFlag(20, 5, 1)\n"),
      "SetFlag(System, HandbookEnabled, True)\nSetFlag(System, 2, False)\nSetFlag(MapUnlock, Reset, False)\nSetFlag(Skills, Charisma, True)\n",
    );
    assert.equal(
      writeSourceText(readSource("SetFlag(System, HandbookEnabled, True)\nSetFlag(System, 4, True)\n")),
      "SetFlag(System, HandbookEnabled, True)\nSetFlag(System, HandbookEnabled, True)\n",
    );
    assert.throws(() => readSource("SetFlag(MapUnlock, HandbookEnabled, 1)\n"), /unknown name 'HandbookEnabled'/);
    assert.deepEqual(readSource("SetFlag(CharacterDead, Celeste, 1)\n").entries[0], {
      opcode: 0x26,
      args: [16, 12, 1],
    });
    // A character name is only meaningful after a character group; SceneFlags slots are not characters
    assert.throws(() => readSource("SetFlag(ObjectInvestigated, Celeste, 1)\n"), /unknown name 'Celeste'/);
    assert.throws(() => readSource("SetFlag(SceneFlags, Taka, 1)\n"), /unknown name 'Taka'/);
  });

  test("SceneFlagName() in Meta() names a SceneFlags slot for SetFlag and IfFlag", () => {
    const source =
      "SetFlag(SceneFlags, RoomIntroSeen, True)\nSetFlag(SceneFlags, 2, False)\nSetFlag(SceneFlags, Reset, False)\nIfFlag(SceneFlags, RoomIntroSeen, !=, False, And, FreeTimeEvent, FreeTimeSpent, !=, True,\n    Goto(1))\n\nMeta()\n    SceneFlagName(1, RoomIntroSeen)\n";
    const script = readSource(source);
    assert.deepEqual(script.entries.slice(0, 4), [
      { opcode: 0x26, args: [15, 1, 1] },
      { opcode: 0x26, args: [15, 2, 0] },
      { opcode: 0x26, args: [15, 32, 0] },
      { opcode: 0x35, args: [15, 1, 0, 0, 6, 12, 0, 0, 1] },
    ]);
    assert.equal(writeSourceText(script), source);
    // The name belongs to the SceneFlags group only, and other groups' slots stay numeric
    assert.throws(
      () =>
        readSource("SetFlag(ObjectInvestigated, RoomIntroSeen, True)\nMeta()\n    SceneFlagName(1, RoomIntroSeen)\n"),
      /unknown name 'RoomIntroSeen'/,
    );
    assert.equal(
      writeSourceText(
        readSource(
          "SetFlag(SceneFlags, 1, True)\nSetFlag(ObjectInvestigated, 1, True)\nMeta()\n    SceneFlagName(1, Seen)\n",
        ),
      ),
      "SetFlag(SceneFlags, Seen, True)\nSetFlag(ObjectInvestigated, 1, True)\n\nMeta()\n    SceneFlagName(1, Seen)\n",
    );
    assert.throws(
      () => readSource("Meta()\n    SceneFlagName(1, A)\n    SceneFlagName(1, B)\n"),
      /scene flag 1 is already named 'A'/,
    );
  });

  test("IfFlag is a repeating condition with named groups, offsets and operators", () => {
    const source = "IfFlag(15, 12, 0, 0, Goto(1))\nIfFlag(13, 20, 1, 1, 7, 16, 3, 0, 0, Goto(2))\nSpeaker(Taka)\n";
    assert.equal(
      roundTrip(source),
      "IfFlag(SceneFlags, 12, !=, False,\n    Goto(1))\nIfFlag(ObjectInvestigated, 20, ==, True, Or, CharacterDead, Mondo, !=, False,\n    Goto(2))\nSpeaker(Taka)\n",
    );
    assert.deepEqual(readSource("IfFlag(CharacterDead, Celeste, !=, False, Goto(1))\n").entries[0], {
      opcode: 0x35,
      args: [16, 12, 0, 0],
    });
  });

  test("unknown names are rejected", () => {
    assert.throws(() => readSource("Speaker(Nobody)\n"), /unknown name 'Nobody' for Byte argument/);
  });
});

describe("text style tags", () => {
  test("a styled run decompiles to a role wrapper", () => {
    assert.equal(formatStyledText("<CLT 4>Huh?\n<CLT>"), "<thought>Huh?\n</thought>");
    assert.equal(formatStyledText("...the <CLT 3>library<CLT>.\n"), "...the <keyword>library</keyword>.\n");
    assert.equal(formatStyledText("<CLT 26>Stab!<CLT>"), "<shout>Stab!</shout>");
    assert.equal(formatStyledText("<CLT 9>... ... ...<CLT>"), "<evidence>... ... ...</evidence>");
  });

  test("several styles in one entry become sibling wrappers", () => {
    const raw = "<CLT 23>Byakuya's <CLT><CLT 3>Report Card<CLT><CLT 23> has been updated.\n<CLT>";
    const sugar = "<system>Byakuya's </system><keyword>Report Card</keyword><system> has been updated.\n</system>";
    assert.equal(formatStyledText(raw), sugar);
    assert.equal(parseStyledText(sugar), raw);
  });

  test("an unclosed wrapper means no reset at the end", () => {
    assert.equal(formatStyledText("<CLT 4>still thinking\n"), "<thought>still thinking\n");
    assert.equal(parseStyledText("<thought>still thinking\n"), "<CLT 4>still thinking\n");
  });

  test("authored nesting closes back to the enclosing style", () => {
    const sugar = "<system>Byakuya's <keyword>Report Card</keyword> has been updated.\n</system>";
    const raw = "<CLT 23>Byakuya's <CLT 3>Report Card<CLT 23> has been updated.\n<CLT>";
    assert.equal(parseStyledText(sugar), raw);
    assert.equal(formatStyledText(raw), sugar);
  });

  test("bytes that wrappers cannot express fall back to flat switches", () => {
    const doubled = "<CLT 4><CLT 4>Only *lending*\n<CLT><CLT 3>ok<CLT><CLT 4>.\n<CLT>";
    const flat = "<style 4><style 4>Only *lending*\n<style 0><style 3>ok<style 0><style 4>.\n<style 0>";
    assert.equal(formatStyledText(doubled), flat);
    assert.equal(parseStyledText(flat), doubled);
    assert.equal(formatStyledText("<CLT 12>unknown style<CLT>"), "<style 12>unknown style<style 0>");
    assert.equal(formatStyledText("<CLT 4>a<CLT>b<CLT>"), "<style 4>a<style 0>b<style 0>");
  });

  test("colour aliases and raw CLT tags are accepted on compile", () => {
    assert.equal(parseStyledText("<cyan>a</cyan> <CLT 3>b<CLT>"), "<CLT 4>a<CLT> <CLT 3>b<CLT>");
    assert.equal(parseStyledText("<(*-*<) ^(*-*)^ (>*-*)>"), "<(*-*<) ^(*-*)^ (>*-*)>");
  });

  test("mismatched close tags are a source error", () => {
    assert.throws(() => readSource('Text("<thought>a</keyword>")\n'), /unexpected <\/keyword>; expected <\/thought>/);
    assert.throws(() => readSource('Text("a</thought>")\n'), /expected no open tag/);
  });

  test("text entries round-trip through the sugar", () => {
    const sugared = 'Text("<thought>Huh?</thought>")\nSpeaker(Taka)\n';
    assert.equal(roundTrip(sugared), sugared);
    const raw = 'RawText("<thought>Huh?</thought>")\nSpeaker(Taka)\n';
    assert.equal(roundTrip(raw), raw);
  });
});

describe("Wait sugar", () => {
  test("Wait(frames) compiles to SetVariable(Wait, =, frames)", () => {
    assert.deepEqual(readSource("Wait(60)\n").entries[0], { opcode: 0x33, args: [6, 0, 0, 60] });
    assert.deepEqual(readSource("Wait(300)\n").entries[0], { opcode: 0x33, args: [6, 0, 1, 44] });
    assert.throws(() => readSource("Wait()\n"), /Wait expects 1 argument/);
    assert.throws(() => readSource("Wait(70000)\n"), /invalid UInt16BE argument/);
  });

  test("assignments to the Wait variable decompile as Wait", () => {
    assert.equal(roundTrip("SetVariable(6, 0, 60)\n"), "Wait(60)\n");
    assert.equal(roundTrip("Wait(60)\n"), "Wait(60)\n");
    // Other variables and other arithmetic modes are left alone
    assert.equal(
      roundTrip("SetVariable(6, 1, 60)\nSetVariable(0, 0, 60)\n"),
      "SetVariable(Wait, +=, 60)\nSetVariable(Time, =, 60)\n",
    );
  });
});

describe("Time sugar", () => {
  test("Time(name) compiles to SetVariable(Time, =, value)", () => {
    assert.deepEqual(readSource("Time(Day)\n").entries[0], { opcode: 0x33, args: [0, 0, 0, 0] });
    assert.deepEqual(readSource("Time(Unknown)\n").entries[0], { opcode: 0x33, args: [0, 0, 0, 4] });
    assert.throws(() => readSource("Time()\n"), /Time expects 1 argument/);
    assert.throws(() => readSource("Time(Dusk)\n"), /unknown time of day 'Dusk'/);
    assert.throws(() => readSource("Time(1)\n"), /unknown time of day '1'/);
  });

  test("named assignments to the Time variable decompile as Time", () => {
    assert.equal(roundTrip("SetVariable(0, 0, 1)\n"), "Time(Night)\n");
    assert.equal(roundTrip("Time(Midnight)\n"), "Time(Midnight)\n");
    // Other arithmetic modes and values without a name are left alone
    assert.equal(
      roundTrip("SetVariable(0, 1, 1)\nSetVariable(0, 0, 60)\n"),
      "SetVariable(Time, +=, 1)\nSetVariable(Time, =, 60)\n",
    );
  });
});

describe("PlaceSprite sugar", () => {
  test("PlaceSprite(slot, character, expression) compiles to Sprite with zero transition and position", () => {
    assert.deepEqual(readSource("PlaceSprite(10, Chihiro, 0)\n").entries[0], { opcode: 0x1e, args: [10, 14, 0, 0, 0] });
    assert.deepEqual(readSource("PlaceSprite(0, Toko, Invisible)\n").entries[0], {
      opcode: 0x1e,
      args: [0, 10, 98, 0, 0],
    });
    assert.deepEqual(readSource("PlaceSprite(5, 3, 98)\n").entries[0], { opcode: 0x1e, args: [5, 3, 98, 0, 0] });
    assert.throws(() => readSource("PlaceSprite(1, Kyoko)\n"), /PlaceSprite expects 3 arguments/);
    assert.throws(() => readSource("PlaceSprite(1, Kyoko, Bogus)\n"), /unknown name 'Bogus'/);
  });

  test("Sprite entries with zero transition and position decompile as PlaceSprite", () => {
    assert.equal(roundTrip("Sprite(1, Kyoko, 0, 0, 0)\n"), "PlaceSprite(1, Kyoko, 0)\n");
    assert.equal(roundTrip("Sprite(1, Kyoko, 98, Set, Leftmost)\n"), "PlaceSprite(1, Kyoko, Invisible)\n");
    assert.equal(roundTrip("PlaceSprite(10, Chihiro, 0)\n"), "PlaceSprite(10, Chihiro, 0)\n");
    // Any other transition or position byte stays a plain Sprite
    assert.equal(roundTrip("Sprite(0, Taka, 6, FadeIn, Center)\n"), "Sprite(0, Taka, 6, FadeIn, Center)\n");
    assert.equal(roundTrip("Sprite(2, Celeste, 0, Set, 21)\n"), "Sprite(2, Celeste, 0, Set, 21)\n");
    assert.equal(roundTrip("Sprite(0, Toko, 98, Set, Center)\n"), "Sprite(0, Toko, Invisible, Set, Center)\n");
  });
});

describe("Present sugar", () => {
  test("GivePresent and ReceivePresent compile to Present(id, mode, 1)", () => {
    assert.deepEqual(readSource("GivePresent(MineralWater)\n").entries[0], { opcode: 0x0d, args: [0, 2, 1] });
    assert.deepEqual(readSource("ReceivePresent(SchoolCrest)\n").entries[0], { opcode: 0x0d, args: [92, 1, 1] });
    assert.throws(() => readSource("GivePresent()\n"), /GivePresent expects 1 argument/);
    assert.throws(() => readSource("GivePresent(Bogus)\n"), /unknown present 'Bogus'/);
    // Only names are accepted, so a typo cannot silently become another item
    assert.throws(() => readSource("ReceivePresent(5)\n"), /unknown present '5'/);
  });

  test("Present is not a source instruction", () => {
    assert.throws(() => readSource("Present(0, 2, 1)\n"), /'Present' is not a source instruction/);
  });

  test("Present entries decompile as sugar and round-trip", () => {
    const present = (args: number[]) => ({ entries: [{ opcode: 0x0d, args }] });
    assert.equal(writeSourceText(present([0, 2, 1])), "GivePresent(MineralWater)\n");
    assert.equal(writeSourceText(present([114, 1, 1])), "ReceivePresent(Unknown)\n");
    assert.equal(roundTrip("GivePresent(ColaCola)\n"), "GivePresent(ColaCola)\n");
  });

  test("bytes the sugar cannot express are an error", () => {
    const present = (args: number[]) => ({ entries: [{ opcode: 0x0d, args }] });
    assert.throws(() => writeSourceText(present([0, 0, 1])), /arithmetic mode 0/);
    assert.throws(() => writeSourceText(present([0, 2, 3])), /quantity 3/);
    assert.throws(() => writeSourceText(present([200, 2, 1])), /unknown present id 200/);
  });
});

describe("Fade sugar", () => {
  const fade = (args: number[]) => ({ entries: [{ opcode: 0x22, args }] });

  test("FadeIn, FadeOut and FadeOutThenWait compile to ScreenFade(direction, colour, frames)", () => {
    assert.deepEqual(readSource("FadeIn(Black, 24)\n").entries[0], { opcode: 0x22, args: [0, 1, 24] });
    assert.deepEqual(readSource("FadeOut(DefaultBlack, 1)\n").entries[0], { opcode: 0x22, args: [1, 0, 1] });
    assert.deepEqual(readSource("FadeOutThenWait(White, 8)\n").entries[0], { opcode: 0x22, args: [101, 2, 8] });
    assert.throws(() => readSource("FadeIn(Black)\n"), /FadeIn expects 2 arguments/);
    assert.throws(() => readSource("FadeOut(Bogus, 24)\n"), /unknown fade colour 'Bogus'/);
    // Only names are accepted for the colour, and the frame count is a byte
    assert.throws(() => readSource("FadeOut(1, 24)\n"), /unknown fade colour '1'/);
    assert.throws(() => readSource("FadeOut(Black, 300)\n"), /invalid Byte argument/);
  });

  test("ScreenFade is not a source instruction", () => {
    assert.throws(() => readSource("ScreenFade(1, 1, 24)\n"), /'ScreenFade' is not a source instruction/);
  });

  test("ScreenFade entries decompile as sugar and round-trip", () => {
    assert.equal(writeSourceText(fade([0, 1, 24])), "FadeIn(Black, 24)\n");
    assert.equal(writeSourceText(fade([1, 0, 1])), "FadeOut(DefaultBlack, 1)\n");
    assert.equal(writeSourceText(fade([101, 1, 24])), "FadeOutThenWait(Black, 24)\n");
    assert.equal(writeSourceText(fade([1, 3, 24])), "FadeOut(Red, 24)\n");
    assert.equal(roundTrip("FadeOutThenWait(White, 64)\n"), "FadeOutThenWait(White, 64)\n");
  });

  test("bytes the sugar cannot express are an error", () => {
    assert.throws(() => writeSourceText(fade([2, 1, 24])), /direction 2/);
    assert.throws(() => writeSourceText(fade([100, 1, 24])), /direction 100/);
    assert.throws(() => writeSourceText(fade([1, 4, 24])), /unknown fade colour 4/);
  });
});

describe("Mode sugar", () => {
  const setUi = (ui: number, visibility: number) => ({ opcode: 0x25, args: [ui, visibility] });
  const speaker = (character: number) => ({ opcode: 0x21, args: [character] });
  const nameShown = setUi(2, 1);
  const nameHidden = setUi(2, 0);
  const textboxShown = setUi(1, 1);

  test("Mode compiles to the Textbox, Thinking and Name toggles and a Speaker, defaulting to Makoto", () => {
    assert.deepEqual(readSource("Mode(Thinking)\n").entries, [textboxShown, setUi(0, 1), nameShown, speaker(0)]);
    assert.deepEqual(readSource("Mode(Speaking)\n").entries, [textboxShown, setUi(0, 0), nameShown, speaker(0)]);
    assert.deepEqual(readSource("Mode(Speaking, Monokuma)\n").entries, [
      textboxShown,
      setUi(0, 0),
      nameShown,
      speaker(15),
    ]);
    assert.deepEqual(readSource("Mode(Thinking, 4)\n").entries, [textboxShown, setUi(0, 1), nameShown, speaker(4)]);
    assert.deepEqual(readSource("Mode(Thinking, Blank)\n").entries, [
      textboxShown,
      setUi(0, 1),
      nameHidden,
      speaker(31),
    ]);
    assert.throws(() => readSource("Mode()\n"), /Mode expects 1 or 2 arguments/);
    assert.throws(() => readSource("Mode(Shouting)\n"), /unknown mode 'Shouting'/);
    assert.throws(() => readSource("Mode(Thinking, Bogus)\n"), /unknown name 'Bogus'/);
  });

  test("Mode(System) shows the textbox, hides the name and speaks as Blank", () => {
    assert.deepEqual(readSource("Mode(System)\n").entries, [textboxShown, nameHidden, speaker(31)]);
    assert.deepEqual(readSource("Mode(System, Makoto)\n").entries, [textboxShown, nameHidden, speaker(0)]);
  });

  test("the toggles are collapsed from anywhere in the SetUI run before the Speaker", () => {
    const script = {
      entries: [setUi(15, 0), setUi(0, 1), nameShown, textboxShown, speaker(0), setUi(0, 0), speaker(15)],
    };
    assert.equal(writeSourceText(script), "SetUI(CameraLook, Hidden)\nMode(Thinking)\nMode(Speaking, Monokuma)\n");
  });

  test("a hidden name makes the run System and leaves a Thinking toggle plain", () => {
    const script = {
      entries: [setUi(15, 0), nameHidden, textboxShown, speaker(31), setUi(0, 1), nameHidden, speaker(0)],
    };
    assert.equal(
      writeSourceText(script),
      "SetUI(CameraLook, Hidden)\nMode(System)\nSetUI(Thinking, Shown)\nMode(System, Makoto)\n",
    );
  });

  test("a Textbox toggle is only absorbed into a Mode, and only when Shown", () => {
    // Shown before a plain Speaker, Hidden before a Mode, Shown before a non-Speaker: all plain
    const script = {
      entries: [
        textboxShown,
        speaker(15),
        setUi(1, 0),
        setUi(0, 1),
        speaker(0),
        textboxShown,
        { opcode: 0x1e, args: [0, 15, 0, 1, 2] },
      ],
    };
    assert.equal(
      writeSourceText(script),
      "SetUI(Textbox, Shown)\nSpeaker(Monokuma)\nSetUI(Textbox, Hidden)\nMode(Thinking)\nSetUI(Textbox, Shown)\nSprite(0, Monokuma, 0, FadeIn, Center)\n",
    );
  });

  test("a toggle without a Speaker after its run, and a Speaker without a toggle, stay plain", () => {
    const script = {
      entries: [
        setUi(0, 0),
        { opcode: 0x1e, args: [0, 15, 0, 1, 2] },
        speaker(15),
        setUi(1, 0),
        speaker(0),
        nameShown,
        speaker(2),
      ],
    };
    assert.equal(
      writeSourceText(script),
      "SetUI(Thinking, Hidden)\nSprite(0, Monokuma, 0, FadeIn, Center)\nSpeaker(Monokuma)\nSetUI(Textbox, Hidden)\nSpeaker(Makoto)\nSetUI(Name, Shown)\nSpeaker(Byakuya)\n",
    );
  });

  test("Mode round-trips, and the plain spelling decompiles to it", () => {
    const source = "Mode(Thinking)\nMode(Speaking, Kyoko)\nMode(System)\nMode(Thinking, Blank)\n";
    assert.equal(roundTrip(source), source);
    assert.equal(
      roundTrip("SetUI(Textbox, Shown)\nSetUI(Thinking, Shown)\nSetUI(Name, Shown)\nSpeaker(Makoto)\n"),
      "Mode(Thinking)\n",
    );
    assert.equal(roundTrip("SetUI(Thinking, Shown)\nSpeaker(Makoto)\n"), "Mode(Thinking)\n");
    assert.equal(roundTrip("SetUI(Name, Hidden)\nSpeaker(Blank)\n"), "Mode(System)\n");
  });
});

describe("block indentation", () => {
  test("block opcodes indent their contents until a 255 closes them", () => {
    const source = "SetOption(1)\nSpeaker(1)\nSetOption(2)\nSpeaker(2)\nSetOption(255)\nSpeaker(3)\n";
    assert.equal(
      writeSourceText(readSource(source)),
      "SetOption(1)\n    Speaker(Taka)\nSetOption(2)\n    Speaker(Byakuya)\nSetOption(255)\nSpeaker(Mondo)\n",
    );
  });

  test("indent width is configurable and leading whitespace is ignored on compile", () => {
    const script = readSource("SetOption(1)\n              Speaker(1)\n");
    assert.equal(writeSourceText(script, { indentSpaces: 2 }), "SetOption(1)\n  Speaker(Taka)\n");
  });
});

describe("source errors", () => {
  test("report the 1-based line, skipping blank and comment lines", () => {
    const source = "# header\n\nSpeaker(1)\nBogus(1)\n";
    assert.throws(
      () => readSource(source),
      (error: unknown) => {
        assert.ok(error instanceof SourceError);
        assert.equal(error.line, 4);
        assert.match(error.message, /line 4: unknown opcode 'Bogus'/);
        return true;
      },
    );
  });

  test("wrong argument counts are rejected instead of silently truncated", () => {
    assert.throws(() => readSource("Speaker(1, 2, 3)\n"), /Speaker expects 1 argument\(s\), got 3/);
    assert.throws(() => readSource("Speaker()\n"), /Speaker expects 1 argument\(s\), got 0/);
    assert.throws(() => readSource("If(1, 2, Goto(1))\n"), /If expects 3 \+ 4n arguments/);
    assert.throws(() => readSource("IfFlag(1, 2, Goto(1))\n"), /IfFlag expects 4 \+ 5n arguments/);
  });

  test("out-of-range and malformed numbers are rejected", () => {
    assert.throws(() => readSource("Speaker(256)\n"), /invalid Byte argument '256'/);
    assert.throws(() => readSource("Label(70000)\n"), /invalid UInt16BE argument '70000'/);
    assert.throws(() => readSource("Speaker(x)\n"), /unknown name 'x' for Byte argument/);
    assert.throws(() => readSource("Sound(x, 1)\n"), /invalid UInt16BE argument 'x'/);
    assert.throws(() => readSource("Text(hello)\n"), /expected a quoted string/);
    assert.throws(() => readSource("Type(Maybe)\n"), /Type expects 'Textless' or 'Text'/);
  });
});

describe("binary edge cases", () => {
  test("a trailing variadic opcode stops at the end of the script data", () => {
    // IfFlag is the last record, followed only by zero padding
    const bytes = textlessFile([0x70, 0x21, 1, 0x70, 0x35, 1, 2, 3, 0, 0, 0, 0]);
    const { entries } = readCompiled(bytes);
    assert.equal(entries.length, 2);
    assert.equal(entries[1].opcode, 0x35);
  });

  test("a short IfFlag keeps every byte visible", () => {
    const source = writeSourceText({
      entries: [
        { opcode: 0x35, args: [7, 8] },
        { opcode: 0x3c, args: [] },
        { opcode: 0x34, args: [0, 1] },
      ],
    });
    assert.equal(source, "IfFlag(7, 8,\n    Goto(1))\n");
  });

  test("a truncated fixed-length entry is shown as raw bytes", () => {
    const source = writeSourceText({ entries: [{ opcode: 0x33, args: [1, 2] }] });
    assert.equal(source, "SetVariable(1, 2)\n");
  });

  test("non-zero bytes after the last record are an error", () => {
    assert.throws(() => readCompiled(textlessFile([0x70, 0x21, 1, 0x07])), BinaryError);
  });

  test("unknown script types are an error", () => {
    assert.throws(() => readCompiled(Uint8Array.from([9, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0])), /unknown script type 9/);
  });
});

describe("Map sugar", () => {
  const mapState = (args: number[]) => ({ entries: [{ opcode: 0x01, args }] });

  test("MapCharacter compiles to MapState(room, character, 0|1) and names the map characters", () => {
    assert.deepEqual(readSource("MapCharacter(136, Aoi, True)\n").entries[0], { opcode: 0x01, args: [136, 9, 1] });
    assert.deepEqual(readSource("MapCharacter(101, Leon, False)\n").entries[0], { opcode: 0x01, args: [101, 4, 0] });
    assert.deepEqual(readSource("MapCharacter(135, MapCharacter_20, True)\n").entries[0], {
      opcode: 0x01,
      args: [135, 20, 1],
    });
    assert.deepEqual(readSource("MapCharacter(1, 16, True)\n").entries[0], { opcode: 0x01, args: [1, 16, 1] });
    assert.throws(() => readSource("MapCharacter(1, Junko, True)\n"), /unknown name 'Junko'/);
    assert.throws(() => readSource("MapCharacter(1, Aoi, 1)\n"), /expected True or False/);
    assert.throws(() => readSource("MapCharacter(255, Aoi, True)\n"), /room 255 is reserved/);
    assert.throws(() => readSource("MapCharacter(1, Aoi)\n"), /MapCharacter expects 3 arguments/);
  });

  test("the reset forms compile to room 255 with their mode byte", () => {
    assert.deepEqual(readSource("MapClearCharacterStatus()\n").entries[0], { opcode: 0x01, args: [255, 0, 252] });
    assert.deepEqual(readSource("MapIcons(True)\n").entries[0], { opcode: 0x01, args: [255, 1, 253] });
    assert.deepEqual(readSource("MapIcons(False)\n").entries[0], { opcode: 0x01, args: [255, 0, 253] });
    assert.deepEqual(readSource("MapClearPositions()\n").entries[0], { opcode: 0x01, args: [255, 0, 254] });
    assert.deepEqual(readSource("MapClearAll()\n").entries[0], { opcode: 0x01, args: [255, 0, 255] });
    assert.throws(() => readSource("MapIcons()\n"), /MapIcons expects 1 argument/);
    assert.throws(() => readSource("MapIcons(Makoto)\n"), /expected True or False/);
    assert.throws(() => readSource("MapClearAll(0)\n"), /MapClearAll expects 0 arguments/);
  });

  test("MapState is not a source instruction", () => {
    assert.throws(() => readSource("MapState(1, 0, 1)\n"), /'MapState' is not a source instruction/);
    assert.throws(() => readSource("LoadSprite(1, 0, 1)\n"), /unknown opcode 'LoadSprite'/);
  });

  test("MapState entries decompile as sugar and round-trip byte for byte", () => {
    const source =
      "MapClearCharacterStatus()\nMapIcons(True)\nMapClearPositions()\nMapCharacter(Kitchen, Aoi, True)\n" +
      "MapCharacter(SayakasRoom, MapCharacter_20, False)\nMapCharacter(Hallway1F, 16, True)\nMapIcons(False)\nMapClearAll()\n";
    assert.equal(roundTrip(source), source);
    assert.equal(writeSourceText(mapState([255, 1, 253])), "MapIcons(True)\n");
  });

  test("MapState bytes outside the five forms are a decompile error", () => {
    assert.throws(() => writeSourceText(mapState([255, 0, 1])), /reserved for the reset forms/);
    assert.throws(() => writeSourceText(mapState([255, 0, 7])), /mode 7 is not understood/);
    assert.throws(() => writeSourceText(mapState([3, 0, 254])), /expects room 255, got 3/);
    assert.throws(() => writeSourceText(mapState([255, 2, 253])), /expects a 0 or 1 payload/);
    assert.throws(() => writeSourceText(mapState([255, 1, 252])), /expects a 0 payload/);
  });
});
