import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BinaryError, SourceError } from "../src/errors.ts";
import { OP_TEXT, OP_TEXT_STYLE, OP_WAIT_FRAME, OP_WAIT_INPUT } from "../src/opcodes/ids.ts";
import { readCompiled } from "../src/io/lin-reader.ts";
import { writeCompiledBytes } from "../src/io/lin-writer.ts";
import { readSource } from "../src/io/linscript-reader.ts";
import { writeSourceText } from "../src/io/linscript-writer.ts";

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
    const source = "Speaker(3)\nSound(513, 2)\nSetVar16(1, 2, 65535)\nStopScript()\n";
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
    const source = 'Text("say \\"hi\\"\\nnext\\\\line")\nSpeaker(1)\n';
    assert.equal(roundTrip(source), source);
    const [entry] = readSource(source).entries;
    assert.ok("text" in entry);
    assert.equal(entry.text, 'say "hi"\nnext\\line');
  });

  test("Evaluate chains round-trip through big-endian packing", () => {
    // Followed by another opcode so the variadic Evaluate does not absorb the alignment padding
    const source = "Evaluate(258, 1, 772, 5, 1, 6, 2)\nSpeaker(1)\n";
    const entry = readSource(source).entries[0];
    assert.deepEqual(entry.args, [1, 2, 1, 3, 4, 5, 0, 1, 6, 0, 2]);
    assert.equal(roundTrip(source), source);
  });

  test("unknown opcodes are written as hex with raw bytes and compile back", () => {
    const bytes = textlessFile([0x70, 0x07, 9, 8, 0x70, 0x21, 1]);
    const source = writeSourceText(readCompiled(bytes));
    assert.equal(source, "0x07(9, 8)\nSpeaker(1)\n");
    assert.deepEqual(readSource(source).entries[0], { opcode: 0x07, args: [9, 8] });
  });

  test("hex names for known opcodes use the opcode's definition", () => {
    assert.deepEqual(readSource("0x21(4)\n").entries[0], { opcode: 0x21, args: [4] });
    assert.throws(() => readSource("0x21(4, 5)\n"), SourceError);
  });

  test("hexOpcodes option renders every known opcode as hex", () => {
    const script = readSource("Speaker(1)\nStopScript()\n");
    assert.equal(writeSourceText(script, { hexOpcodes: true }), "0x21(1)\n0x1A()\n");
  });
});

describe("AutoText sugar", () => {
  test("newlines expand to WaitFrame and the group ends with WaitInput", () => {
    const { entries } = readSource('AutoText("one\\ntwo\\nthree")');
    assert.deepEqual(
      entries.map((e) => e.opcode),
      [OP_TEXT, OP_WAIT_FRAME, OP_WAIT_FRAME, OP_WAIT_INPUT],
    );
  });

  test("CLT colour tags expand to TextStyle opcodes", () => {
    const { entries } = readSource('AutoText("<CLT 3>red<CLT> plain <CLT 5>blue")');
    assert.deepEqual(
      entries.map((e) => [e.opcode, ...e.args]),
      [[OP_TEXT_STYLE, 3], [OP_TEXT, 0, 0], [OP_TEXT_STYLE, 0], [OP_TEXT_STYLE, 5], [OP_WAIT_INPUT]],
    );
  });

  test("expanded groups collapse back to AutoText on decompile", () => {
    for (const source of ['AutoText("one\\ntwo")\n', 'AutoText("<CLT 3>red<CLT> plain")\n', 'AutoText("a\\n<CLT 2>b")\n']) {
      assert.equal(roundTrip(source), source);
    }
  });

  test("a Text not closed by WaitInput stays a plain Text", () => {
    const source = 'Text("hi")\nWaitFrame()\nSpeaker(1)\n';
    assert.equal(roundTrip(source), source);
  });
});

describe("block indentation", () => {
  test("block opcodes indent their contents until a 255 closes them", () => {
    const source = "SetOption(1)\nSpeaker(1)\nSetOption(2)\nSpeaker(2)\nSetOption(255)\nSpeaker(3)\n";
    assert.equal(
      writeSourceText(readSource(source)),
      "SetOption(1)\n  Speaker(1)\nSetOption(2)\n  Speaker(2)\nSetOption(255)\nSpeaker(3)\n",
    );
  });

  test("indent width is configurable and leading whitespace is ignored on compile", () => {
    const script = readSource("SetOption(1)\n        Speaker(1)\n");
    assert.equal(writeSourceText(script, { indentSpaces: 4 }), "SetOption(1)\n    Speaker(1)\n");
  });
});

describe("source errors", () => {
  test("report the 1-based line, skipping blank and comment lines", () => {
    const source = "# header\n\nSpeaker(1)\nBogus(1)\n";
    assert.throws(() => readSource(source), (error: unknown) => {
      assert.ok(error instanceof SourceError);
      assert.equal(error.line, 4);
      assert.match(error.message, /line 4: unknown opcode 'Bogus'/);
      return true;
    });
  });

  test("wrong argument counts are rejected instead of silently truncated", () => {
    assert.throws(() => readSource("Speaker(1, 2, 3)\n"), /Speaker expects 1 argument\(s\), got 3/);
    assert.throws(() => readSource("Speaker()\n"), /Speaker expects 1 argument\(s\), got 0/);
    assert.throws(() => readSource("Evaluate(1, 2)\n"), /Evaluate expects 3 \+ 4n arguments/);
    assert.throws(() => readSource("EvaluateFlag(1, 2)\n"), /EvaluateFlag expects at least 4 arguments/);
  });

  test("out-of-range and malformed numbers are rejected", () => {
    assert.throws(() => readSource("Speaker(256)\n"), /invalid Byte argument '256'/);
    assert.throws(() => readSource("Label(70000)\n"), /invalid UInt16BE argument '70000'/);
    assert.throws(() => readSource("Speaker(x)\n"), /invalid Byte argument 'x'/);
    assert.throws(() => readSource("Text(hello)\n"), /expected a quoted string/);
    assert.throws(() => readSource("Type(Maybe)\n"), /Type expects 'Textless' or 'Text'/);
  });
});

describe("binary edge cases", () => {
  test("a trailing variadic opcode stops at the end of the script data", () => {
    // EvaluateFlag is the last record, followed only by zero padding
    const bytes = textlessFile([0x70, 0x21, 1, 0x70, 0x35, 1, 2, 3, 0, 0, 0, 0]);
    const { entries } = readCompiled(bytes);
    assert.equal(entries.length, 2);
    assert.equal(entries[1].opcode, 0x35);
  });

  test("a short EvaluateFlag keeps every byte visible", () => {
    const source = writeSourceText({ entries: [{ opcode: 0x35, args: [7, 8] }] });
    assert.equal(source, "EvaluateFlag(7, 8)\n");
  });

  test("a truncated fixed-length entry is shown as raw bytes", () => {
    const source = writeSourceText({ entries: [{ opcode: 0x33, args: [1, 2] }] });
    assert.equal(source, "SetVar16(1, 2)\n");
  });

  test("non-zero bytes after the last record are an error", () => {
    assert.throws(() => readCompiled(textlessFile([0x70, 0x21, 1, 0x07])), BinaryError);
  });

  test("unknown script types are an error", () => {
    assert.throws(() => readCompiled(Uint8Array.from([9, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0])), /unknown script type 9/);
  });
});
