import { writeFile } from "node:fs/promises";
import { planAutoText } from "./opcodes/autoTextOpcode.ts";
import { formatRawBytes } from "./opcodes/baseOpcode.ts";
import { OP_TEXT, OP_TYPE, OPCODE_MARKER } from "./opcodes/ids.ts";
import { getOpcode, hexOpcodeName } from "./opcodes/opcodeDictionary.ts";
import { encodeValue, ParamType } from "./parameter.ts";
import { type Script, ScriptType } from "./script.ts";

// ---------------------------------------------------------------------------
// .linscript source
// ---------------------------------------------------------------------------

export interface WriteSourceOptions {
  /** Spaces per indentation level. */
  indentSpaces?: number;
  /** Write every opcode as `0xNN` instead of its name. */
  hexOpcodes?: boolean;
}

export const DEFAULT_INDENT_SPACES = 2;

/** Decompiled files start with a UTF-8 BOM, matching the original C# tool byte for byte. */
const UTF8_BOM = "\uFEFF";

/** Opcodes that open an indented block; an argument of 255 closes it instead. */
const BLOCK_OPCODES = new Set(["SetOption", "CheckObject", "CheckCharacter"]);
const BLOCK_CLOSE = 255;

/** Render a script as `.linscript` source. */
export function writeSourceText(script: Script, options: WriteSourceOptions = {}): string {
  const indent = " ".repeat(options.indentSpaces ?? DEFAULT_INDENT_SPACES);
  const { entries } = script;
  const { autoText, skipped } = planAutoText(entries);

  const lines: string[] = [];
  // Each block opcode indents independently; nesting depth is the number currently open
  const openBlocks = new Set<string>();

  entries.forEach((entry, index) => {
    // Type is implied by the presence of Text opcodes and regenerated on compile
    if (skipped.has(index) || entry.opcode === OP_TYPE) {
      return;
    }

    const opcode = getOpcode(entry.opcode);
    const block = opcode !== undefined && BLOCK_OPCODES.has(opcode.name) && entry.args.length > 0 ? opcode.name : null;
    if (block !== null) {
      // A block opcode always ends the previous block of its kind before writing
      openBlocks.delete(block);
    }

    let name: string;
    let args: string;
    if (opcode === undefined) {
      name = hexOpcodeName(entry.opcode);
      args = formatRawBytes(entry.args);
    } else {
      name = autoText.has(index) ? "AutoText" : options.hexOpcodes ? hexOpcodeName(entry.opcode) : opcode.name;
      args = opcode.formatArgs(entry);
    }
    lines.push(`${indent.repeat(openBlocks.size)}${name}(${args})`);

    if (block !== null && entry.args[0] !== BLOCK_CLOSE) {
      openBlocks.add(block);
    }
  });

  return lines.map((line) => `${line}\n`).join("");
}

export async function writeSourceFile(script: Script, path: string, options: WriteSourceOptions = {}): Promise<void> {
  await writeFile(path, UTF8_BOM + writeSourceText(script, options), "utf8");
}

// ---------------------------------------------------------------------------
// compiled .lin bytes
// ---------------------------------------------------------------------------

/**
 * Serialise a script to `.lin` bytes. See `readCompiled` for the layout. The script type is
 * inferred from the presence of Text entries, Text ids are assigned in order of appearance, and
 * any Type entries in the input are replaced by a synthesised one carrying the text count.
 */
export function writeCompiledBytes(script: Script): Buffer {
  const texts = script.entries.filter((entry) => entry.opcode === OP_TEXT).map((entry) => entry.text ?? "");
  const type = texts.length > 0 ? ScriptType.Text : ScriptType.Textless;
  const file = new ByteWriter();

  // Header. Size fields are patched once their values are known.
  file.pushInt32(type);
  file.pushInt32(type === ScriptType.Text ? 16 : 12);
  const textBlockPosField = type === ScriptType.Text ? file.reserveInt32() : null;
  const fileSizeField = file.reserveInt32();

  // Script data
  writeRecord(file, OP_TYPE, encodeValue(ParamType.UInt16LE, texts.length));
  let nextTextId = 0;
  for (const entry of script.entries) {
    if (entry.opcode === OP_TYPE) {
      continue;
    }
    const args = entry.opcode === OP_TEXT ? encodeValue(ParamType.UInt16BE, nextTextId++) : entry.args;
    writeRecord(file, entry.opcode, args);
  }
  file.padTo4();

  if (textBlockPosField !== null) {
    file.setInt32(textBlockPosField, file.length);
    writeTextBlock(file, texts);
    file.padTo4();
  }

  file.setInt32(fileSizeField, file.length);
  return file.toBuffer();
}

export async function writeCompiledFile(script: Script, path: string): Promise<void> {
  await writeFile(path, writeCompiledBytes(script));
}

function writeRecord(file: ByteWriter, opcode: number, args: ArrayLike<number>): void {
  file.push(OPCODE_MARKER, opcode);
  file.pushMany(args);
}

/** Text block: count, one offset per text plus an end offset (all relative to the block), then the strings. */
function writeTextBlock(file: ByteWriter, texts: readonly string[]): void {
  const encoded = texts.map(encodeTextEntry);

  file.pushInt32(texts.length);
  let offset = 4 + (texts.length + 1) * 4;
  for (const bytes of encoded) {
    file.pushInt32(offset);
    offset += bytes.length;
  }
  file.pushInt32(offset);

  for (const bytes of encoded) {
    file.pushMany(bytes);
  }
}

/** Encode a text entry as UTF-16LE with a leading byte-order mark and a null terminator. */
function encodeTextEntry(text: string): Buffer {
  const terminated = text.endsWith("\0") ? text : `${text}\0`;
  const encoded = Buffer.from(terminated, "utf16le");
  const hasBom = encoded[0] === 0xff && encoded[1] === 0xfe;
  return hasBom ? encoded : Buffer.concat([Buffer.from([0xff, 0xfe]), encoded]);
}

/** Growable byte buffer with the little-endian int32 writes the LIN format uses. */
class ByteWriter {
  private readonly bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  push(...values: number[]): void {
    this.bytes.push(...values);
  }

  pushMany(values: ArrayLike<number>): void {
    for (let i = 0; i < values.length; i++) {
      this.bytes.push(values[i]);
    }
  }

  pushInt32(value: number): void {
    this.bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
  }

  /** Push a zero int32 and return its offset, for patching later with `setInt32`. */
  reserveInt32(): number {
    const offset = this.bytes.length;
    this.pushInt32(0);
    return offset;
  }

  setInt32(offset: number, value: number): void {
    this.bytes[offset] = value & 0xff;
    this.bytes[offset + 1] = (value >>> 8) & 0xff;
    this.bytes[offset + 2] = (value >>> 16) & 0xff;
    this.bytes[offset + 3] = (value >>> 24) & 0xff;
  }

  padTo4(): void {
    while (this.bytes.length % 4 !== 0) {
      this.bytes.push(0x00);
    }
  }

  toBuffer(): Buffer {
    return Buffer.from(this.bytes);
  }
}
