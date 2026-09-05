import { readFile } from "node:fs/promises";
import { BinaryError, SourceError } from "./errors.ts";
import { OP_TEXT, OPCODE_MARKER } from "./opcodes/ids.ts";
import { getOpcode, getOpcodeByName, hexOpcodeName, parseHexOpcodeName } from "./opcodes/opcodeDictionary.ts";
import { ParamType, parseArg, splitArgs } from "./parameter.ts";
import { type Script, type ScriptEntry, ScriptType } from "./script.ts";

// ---------------------------------------------------------------------------
// .linscript source
// ---------------------------------------------------------------------------

/** Matches `OpcodeName(args)` or `0xNN(args)`, capturing the name and the raw argument text. */
const OPCODE_LINE = /^(\w+)\s*\((.*)\)$/;

/** Parse `.linscript` source text. Blank lines and `#` comments are ignored. */
export function readSource(source: string): Script {
  const entries: ScriptEntry[] = [];

  splitLines(source).forEach((rawLine, index) => {
    const line = index + 1;
    const text = rawLine.trim();
    if (text.length === 0 || text.startsWith("#")) {
      return;
    }

    const match = OPCODE_LINE.exec(text);
    if (match === null) {
      throw new SourceError(line, `invalid syntax: ${text}`);
    }
    const [, name, argsText] = match;
    entries.push(...parseOpcodeLine(name, argsText, line));
  });

  return { entries };
}

export async function readSourceFile(path: string): Promise<Script> {
  return readSource(await readFile(path, "utf8"));
}

function parseOpcodeLine(name: string, argsText: string, line: number): ScriptEntry[] {
  const opcode = getOpcodeByName(name);
  if (opcode !== undefined) {
    return opcode.parseSource(argsText, line);
  }

  // An unregistered `0xNN(a, b, c)` is written by the decompiler for unknown opcodes; take its bytes verbatim
  const rawId = parseHexOpcodeName(name);
  if (rawId !== undefined) {
    const args = splitArgs(argsText).flatMap((value) => parseArg(ParamType.Byte, value, line));
    return [{ opcode: rawId, args }];
  }

  throw new SourceError(line, `unknown opcode '${name}'`);
}

function splitLines(source: string): string[] {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  return text.split(/\r\n|\r|\n/);
}

// ---------------------------------------------------------------------------
// compiled .lin bytes
// ---------------------------------------------------------------------------

/**
 * Parse a compiled `.lin` file.
 *
 * Layout (all integers little-endian int32):
 *
 *     Textless: type=1, headerSize, fileSize, script data...
 *     Text:     type=2, headerSize, textBlockPos, fileSize, script data..., text block
 *
 * Script data is a sequence of `0x70 <opcode> <args...>` records, zero-padded to the text block.
 * The text block is a count, `count + 1` offsets relative to the block start, then UTF-16LE strings.
 */
export function readCompiled(bytes: Uint8Array): Script {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const int32 = (offset: number) => view.getInt32(offset, true);

  const type = int32(0x0);
  const headerSize = int32(0x4);

  switch (type) {
    case ScriptType.Textless: {
      const fileSize = int32(0x8) || bytes.length;
      return { entries: readScriptData(bytes, headerSize, fileSize) };
    }
    case ScriptType.Text: {
      const textBlockPos = int32(0x8);
      const fileSize = int32(0xc) || bytes.length;
      const entries = readScriptData(bytes, headerSize, textBlockPos);
      attachTextEntries(entries, bytes, textBlockPos, fileSize);
      return { entries };
    }
    default:
      throw new BinaryError(`unknown script type ${type}`);
  }
}

export async function readCompiledFile(path: string): Promise<Script> {
  return readCompiled(new Uint8Array(await readFile(path)));
}

function readScriptData(bytes: Uint8Array, start: number, end: number): ScriptEntry[] {
  const entries: ScriptEntry[] = [];
  let pos = start;

  while (pos < end) {
    if (bytes[pos] !== OPCODE_MARKER) {
      expectZeroPadding(bytes, pos, end);
      break;
    }
    const id = bytes[pos + 1];
    pos += 2;

    const opcode = getOpcode(id);
    const argEnd = opcode === undefined || opcode.variadic ? findNextMarker(bytes, pos, end) : pos + opcode.argByteCount;

    entries.push({ opcode: id, args: Array.from(bytes.subarray(pos, argEnd)) });
    pos = argEnd;
  }

  return entries;
}

/** Once the opcode records stop, only zero bytes may remain before `end`. */
function expectZeroPadding(bytes: Uint8Array, from: number, end: number): void {
  for (let pos = from; pos < end; pos++) {
    if (bytes[pos] !== 0x00) {
      throw new BinaryError(`expected opcode marker ${hexOpcodeName(OPCODE_MARKER)} at offset ${pos}, got ${hexOpcodeName(bytes[pos])}`);
    }
  }
}

function findNextMarker(bytes: Uint8Array, from: number, end: number): number {
  let pos = from;
  while (pos < end && bytes[pos] !== OPCODE_MARKER) {
    pos++;
  }
  return pos;
}

function attachTextEntries(entries: ScriptEntry[], bytes: Uint8Array, textBlockPos: number, fileSize: number): void {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textCount = view.getInt32(textBlockPos, true);
  const offsetAt = (textId: number) => view.getInt32(textBlockPos + 4 + textId * 4, true);
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (const entry of entries) {
    if (entry.opcode !== OP_TEXT) {
      continue;
    }
    const textId = (entry.args[0] << 8) | entry.args[1];
    if (textId >= textCount) {
      throw new BinaryError(`text id ${textId} out of range (${textCount} entries)`);
    }

    const start = textBlockPos + offsetAt(textId);
    const end = textId === textCount - 1 ? fileSize : textBlockPos + offsetAt(textId + 1);
    const text = buffer.toString("utf16le", start, end);
    // Drop a byte-reversed BOM if one leads the entry
    entry.text = text.startsWith("\uFFFE") ? text.slice(1) : text;
  }
}
