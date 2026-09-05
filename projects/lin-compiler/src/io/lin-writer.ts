import { writeFile } from "node:fs/promises";
import { OPCODE_MARKER, Opcode } from "../definitions/opcode.definition.ts";
import { ParameterType } from "../definitions/parameter.definition.ts";
import { encodeValue } from "../parameter.ts";
import { type Script, ScriptType } from "../definitions/script.definition.ts";

/**
 * Serialise a script to `.lin` bytes. See `readCompiled` for the layout. The script type is
 * inferred from the presence of Text entries, Text ids are assigned in order of appearance, and
 * any Type entries in the input are replaced by a synthesised one carrying the text count.
 */
export function writeCompiledBytes(script: Script): Buffer {
  const texts = script.entries
    .filter((entry) => entry.opcode === Opcode.Text)
    .map((entry) => ("text" in entry ? entry.text : ""));
  const type = texts.length > 0 ? ScriptType.Text : ScriptType.Textless;
  const file = new ByteWriter();

  // Header. Size fields are patched once their values are known.
  file.pushInt32(type);
  file.pushInt32(type === ScriptType.Text ? 16 : 12);
  const textBlockPosField = type === ScriptType.Text ? file.reserveInt32() : null;
  const fileSizeField = file.reserveInt32();

  // Script data
  writeRecord(file, Opcode.Type, encodeValue(ParameterType.UInt16LE, texts.length));
  let nextTextId = 0;
  for (const entry of script.entries) {
    if (entry.opcode === Opcode.Type) {
      continue;
    }
    const args = entry.opcode === Opcode.Text ? encodeValue(ParameterType.UInt16BE, nextTextId++) : entry.args;
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
