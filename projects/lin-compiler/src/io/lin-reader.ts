import { readFile } from "node:fs/promises";
import { OPCODE_MARKER, Opcode } from "../definitions/opcode.definition.ts";
import { type Script, type ScriptEntry, ScriptType } from "../definitions/script.definition.ts";
import { BinaryError } from "../errors.ts";
import { getOpcode, hexOpcodeName } from "../opcodes/opcodeDictionary.ts";

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
    const argEnd =
      opcode === undefined || opcode.variadic ? findNextMarker(bytes, pos, end) : pos + opcode.argByteCount;

    entries.push({ opcode: id, args: Array.from(bytes.subarray(pos, argEnd)) });
    pos = argEnd;
  }

  return entries;
}

/** Once the opcode records stop, only zero bytes may remain before `end`. */
function expectZeroPadding(bytes: Uint8Array, from: number, end: number): void {
  for (let pos = from; pos < end; pos++) {
    if (bytes[pos] !== 0x00) {
      throw new BinaryError(
        `expected opcode marker ${hexOpcodeName(OPCODE_MARKER)} at offset ${pos}, got ${hexOpcodeName(bytes[pos])}`,
      );
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

  entries.forEach((entry, index) => {
    if (entry.opcode !== Opcode.Text) {
      return;
    }
    const textId = (entry.args[0] << 8) | entry.args[1];
    if (textId >= textCount) {
      throw new BinaryError(`text id ${textId} out of range (${textCount} entries)`);
    }

    const start = textBlockPos + offsetAt(textId);
    const end = textId === textCount - 1 ? fileSize : textBlockPos + offsetAt(textId + 1);
    const text = buffer.toString("utf16le", start, end);
    // Drop a byte-reversed BOM if one leads the entry
    entries[index] = { ...entry, text: text.startsWith("\uFFFE") ? text.slice(1) : text };
  });
}
