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
    const source = "Speaker(Mondo)\nSound(513, 2)\nSetVariable(1, 2, 65535)\nStopScript()\n";
    assert.equal(roundTrip(source), source);
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
    const source = "If(258, ==, 772, 5, 1, 9, 2)\nSpeaker(Taka)\n";
    const entry = readSource(source).entries[0];
    assert.deepEqual(entry.args, [1, 2, 1, 3, 4, 5, 0, 1, 9, 0, 2]);
    assert.equal(roundTrip(source), source);
  });

  test("unknown opcodes are written as hex with raw bytes, which source cannot compile", () => {
    const bytes = textlessFile([0x70, 0x07, 9, 8, 0x70, 0x21, 1]);
    const source = writeSourceText(readCompiled(bytes));
    assert.equal(source, "0x07(9, 8)\nSpeaker(Taka)\n");
    assert.throws(() => readSource(source), /unknown opcode '0x07'/);
    // Hex names are not accepted for known opcodes either
    assert.throws(() => readSource("0x21(4)\n"), /unknown opcode '0x21'/);
  });

  test("hexOpcodes option renders every known opcode as hex", () => {
    const script = readSource("Speaker(1)\nStopScript()\n");
    assert.equal(writeSourceText(script, { hexOpcodes: true }), "0x21(1)\n0x1A()\n");
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
    const [, keyword] = readSource('Text("say <keyword>hi</keyword>")').entries;
    assert.ok("text" in keyword);
    assert.equal(keyword.text, "say <CLT 3>hi\n<CLT>");
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

  test("a text entry without the trailing newline is written as RawText", () => {
    const source = 'RawText("*Ding dong*")\nWaitInput()\n';
    assert.equal(roundTrip(source), source);
    // A newline between closing tags is not where the sugar would put it, so the bytes stay raw
    const between = 'TextStyle(4)\nRawText("<style 4>a<style 0>\\n<style 0>")\nTextStyle(0)\nWaitFrame()\nTextStyle(0)\nWaitInput()\n';
    assert.equal(roundTrip(between), between);
    const styled = 'TextStyle(23)\nRawText("<system>*Ding dong*</system>")\nTextStyle(0)\nWaitInput()\n';
    assert.equal(roundTrip(styled), styled);
  });

  test("a text entry not closed by WaitInput is written as RawText", () => {
    const source = 'RawText("hi\\n")\nWaitFrame()\nSpeaker(Taka)\n';
    assert.equal(roundTrip(source), source);
    // Menu option labels are the common case: a text with a WaitFrame but no WaitInput
    const option = 'SetOption(1)\n  RawText("Yes\\n")\n  WaitFrame()\n  Goto(1)\nSetOption(255)\n';
    assert.equal(roundTrip(option), option);
  });

  test("RawText compiles to exactly one entry with no implicit newline", () => {
    assert.deepEqual(readSource('RawText("hi\\n")\n').entries, [{ opcode: 0x02, args: [0, 0], text: "hi\n" }]);
    assert.deepEqual(
      readSource('Text("hi")\n').entries.map((e) => e.opcode),
      [Opcode.RawText, Opcode.WaitFrame, Opcode.WaitInput],
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
      roundTrip("If(0, 0, 5)\nIf(0, 1, 5, 6, 8, 2, 9, 7, 8, 3, 9)\nSpeaker(Taka)\n"),
      "If(0, !=, 5)\nIf(0, ==, 5, And, 8, <=, 9, Or, 8, >=, 9)\nSpeaker(Taka)\n",
    );
    assert.equal(
      roundTrip("IfRelationship(3, 4, 20)\nIfFreeTimeEvent(3, 5, 0)\n"),
      "IfRelationship(3, <, 20)\nIfFreeTimeEvent(3, >, 0)\n",
    );
    // Bare = is accepted for ==, and numbers still work everywhere
    assert.deepEqual(readSource("If(0, =, 5)\n").entries[0].args, [0, 0, 1, 0, 5]);
    assert.deepEqual(readSource("If(0, 1, 5)\n").entries[0].args, [0, 0, 1, 0, 5]);
    assert.throws(() => readSource("If(0, <>, 5)\n"), /invalid Byte argument '<>'/);
  });

  test("flag groups are named and character-group offsets become character names", () => {
    assert.equal(
      roundTrip("SetFlag(15, 0, 1)\nSetFlag(16, 12, 1)\nSetFlag(13, 5, 1)\nSetFlag(15, 32, 0)\nSetFlag(90, 0, 1)\n"),
      "SetFlag(CharacterInvestigated, Makoto, True)\nSetFlag(CharacterDead, Celeste, True)\nSetFlag(ObjectInvestigated, 5, True)\nSetFlag(CharacterInvestigated, 32, False)\nSetFlag(90, 0, True)\n",
    );
    assert.deepEqual(readSource("SetFlag(CharacterDead, Celeste, 1)\n").entries[0], {
      opcode: 0x26,
      args: [16, 12, 1],
    });
    // A character name is only meaningful after a character group
    assert.throws(() => readSource("SetFlag(ObjectInvestigated, Celeste, 1)\n"), /invalid Byte argument 'Celeste'/);
  });

  test("IfFlag is a repeating condition with named groups, offsets and operators", () => {
    const source = "IfFlag(15, 12, 0, 0)\nIfFlag(13, 20, 1, 1, 7, 16, 3, 0, 0)\nSpeaker(Taka)\n";
    assert.equal(
      roundTrip(source),
      "IfFlag(CharacterInvestigated, Celeste, !=, False)\nIfFlag(ObjectInvestigated, 20, ==, True, Or, CharacterDead, Mondo, !=, False)\nSpeaker(Taka)\n",
    );
    assert.deepEqual(readSource("IfFlag(CharacterInvestigated, Celeste, !=, False)\n").entries[0], {
      opcode: 0x35,
      args: [15, 12, 0, 0],
    });
  });

  test("hexOpcodes output keeps every argument numeric", () => {
    assert.equal(writeSourceText(readSource("Speaker(Makoto)\n"), { hexOpcodes: true }), "0x21(0)\n");
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

  test("text entries round-trip through the sugar and hex mode shows raw tags", () => {
    const sugared = 'Text("<thought>Huh?</thought>")\nSpeaker(Taka)\n';
    assert.equal(roundTrip(sugared), sugared);
    const raw = 'RawText("<thought>Huh?</thought>")\nSpeaker(Taka)\n';
    assert.equal(roundTrip(raw), raw);
    assert.equal(writeSourceText(readSource(raw), { hexOpcodes: true }), '0x02("<CLT 4>Huh?<CLT>")\n0x21(1)\n');
  });
});

describe("Wait sugar", () => {
  test("Wait(frames) compiles to SetVariable(Wait, Assign, frames)", () => {
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
      "SetVariable(6, 1, 60)\nSetVariable(0, 0, 60)\n",
    );
  });

  test("hex mode writes the raw SetVariable", () => {
    assert.equal(writeSourceText(readSource("Wait(60)\n"), { hexOpcodes: true }), "0x33(6, 0, 60)\n");
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

  test("hex mode writes the raw Present bytes", () => {
    assert.equal(writeSourceText(readSource("GivePresent(MineralWater)\n"), { hexOpcodes: true }), "0x0D(0, 2, 1)\n");
  });
});

describe("block indentation", () => {
  test("block opcodes indent their contents until a 255 closes them", () => {
    const source = "SetOption(1)\nSpeaker(1)\nSetOption(2)\nSpeaker(2)\nSetOption(255)\nSpeaker(3)\n";
    assert.equal(
      writeSourceText(readSource(source)),
      "SetOption(1)\n  Speaker(Taka)\nSetOption(2)\n  Speaker(Byakuya)\nSetOption(255)\nSpeaker(Mondo)\n",
    );
  });

  test("indent width is configurable and leading whitespace is ignored on compile", () => {
    const script = readSource("SetOption(1)\n        Speaker(1)\n");
    assert.equal(writeSourceText(script, { indentSpaces: 4 }), "SetOption(1)\n    Speaker(Taka)\n");
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
    assert.throws(() => readSource("If(1, 2)\n"), /If expects 3 \+ 4n arguments/);
    assert.throws(() => readSource("IfFlag(1, 2)\n"), /IfFlag expects 4 \+ 5n arguments/);
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
    const source = writeSourceText({ entries: [{ opcode: 0x35, args: [7, 8] }] });
    assert.equal(source, "IfFlag(7, 8)\n");
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
