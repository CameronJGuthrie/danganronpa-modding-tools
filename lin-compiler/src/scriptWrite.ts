import { writeFile } from "node:fs/promises";
import { OP_TEXT, OP_TEXT_STYLE, OP_TYPE, OP_WAIT_FRAME, OP_WAIT_INPUT } from "./opcodes/ids.js";
import { getOpcodeDefinition } from "./opcodes/opcodeDictionary.js";
import { printLine, toHexOpcode } from "./options.js";
import { SourceBuilder } from "./output.js";
import { type Script, type ScriptEntry, ScriptType } from "./script.js";

const UTF8_BOM = "\uFEFF";
const HAS_CLT = /<CLT\s+\d+>|<CLT>/;

/** Opcodes whose 255 argument closes a block, and whose other values open one. */
const INDENTING_OPCODES = ["SetOption", "CheckObject", "CheckCharacter"] as const;

export function writeSourceText(s: Script, indentSpaces = 2): string {
  const output = new SourceBuilder();

  // Indent depth contributed by each block-opening opcode; they sum additively
  const indentLevels = new Map<string, number>(INDENTING_OPCODES.map((name) => [name, 0]));

  // First pass: determine which Text entries can use AutoText sugar, and mark opcodes to skip
  const { useAutoText, skipEntry } = planAutoText(s);

  // Second pass: write entries
  for (let i = 0; i < s.scriptData.length; i++) {
    const e = s.scriptData[i];

    // Skip entries marked in the first pass
    if (skipEntry[i]) {
      continue;
    }

    // Skip Type opcode - it's inferred from the presence of Text opcodes
    if (e.opcode === OP_TYPE) {
      continue;
    }

    const opcode = getOpcodeDefinition(e.opcode);
    const isIndenting = opcode !== null && indentLevels.has(opcode.name ?? "");

    // A block-opening opcode always closes the previous block first
    if (isIndenting && e.args.length > 0) {
      indentLevels.set(opcode.name as string, 0);
    }

    // Write indentation (additive across all block-opening opcodes)
    const totalIndent = [...indentLevels.values()].reduce((a, b) => a + b, 0);
    output.append(" ".repeat(totalIndent * indentSpaces));

    if (opcode === null) {
      // Unknown opcode - write as hex with raw bytes
      output.append(`${toHexOpcode(e.opcode)}(`);
      if (e.args.length > 0) {
        output.appendJoin(", ", e.args.map(String));
      }
      output.appendLine(")");
    } else if (e.opcode === OP_TEXT && useAutoText[i]) {
      // Write as AutoText instead of Text
      output.append("AutoText(");
      opcode.writeSourceArgs(output, s, e);
      output.appendLine(")");
    } else {
      opcode.writeSource(output, s, e);
    }

    // After writing, increase the indent for the block's content (except for 255, which closes it)
    if (isIndenting && e.args.length > 0 && e.args[0] !== 255) {
      indentLevels.set(opcode.name as string, 1);
    }
  }

  return output.toString();
}

export async function writeSource(s: Script, filename: string, indentSpaces = 2): Promise<void> {
  printLine("[write] writing decompiled file...");
  // .NET's StreamWriter with Encoding.UTF8 emits a BOM; keep the output byte-compatible
  await writeFile(filename, UTF8_BOM + writeSourceText(s, indentSpaces), "utf8");
  printLine("[write] done.");
}

/**
 * Finds Text entries that can be collapsed into AutoText sugar: a Text followed only by
 * WaitFrame (and TextStyle, when the text carries CLT tags) and terminated by WaitInput.
 */
function planAutoText(s: Script): { useAutoText: boolean[]; skipEntry: boolean[] } {
  const useAutoText = new Array<boolean>(s.scriptData.length).fill(false);
  const skipEntry = new Array<boolean>(s.scriptData.length).fill(false);

  for (let i = 0; i < s.scriptData.length; i++) {
    const e = s.scriptData[i];

    if (e.opcode !== OP_TEXT || e.text == null) {
      continue;
    }

    const hasCLTTags = HAS_CLT.test(e.text);

    // A preceding TextStyle belongs to the CLT tags and is regenerated on compile
    const hasMatchingPrecedingTextStyle = hasCLTTags && i > 0 && s.scriptData[i - 1].opcode === OP_TEXT_STYLE;

    let waitInputIndex = -1;
    let lookAhead = i + 1;
    while (lookAhead < s.scriptData.length) {
      const nextOpcode = s.scriptData[lookAhead].opcode;

      if (nextOpcode === OP_WAIT_INPUT) {
        waitInputIndex = lookAhead;
        break;
      }
      if (nextOpcode === OP_WAIT_FRAME || (nextOpcode === OP_TEXT_STYLE && hasCLTTags)) {
        lookAhead++;
        continue;
      }
      // Non-sugar opcode found before WaitInput
      break;
    }

    if (waitInputIndex === -1) {
      continue;
    }

    useAutoText[i] = true;

    if (hasMatchingPrecedingTextStyle) {
      skipEntry[i - 1] = true;
    }

    // Mark all opcodes between Text and WaitInput (inclusive) to skip
    for (let j = i + 1; j <= waitInputIndex; j++) {
      skipEntry[j] = true;
    }
  }

  return { useAutoText, skipEntry };
}

/** Growable byte buffer with the little-endian int32 writes the LIN format uses. */
class ByteWriter {
  private bytes: number[] = [];

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

/** Encode a text entry as UTF-16LE with a leading byte-order mark and a null terminator. */
function encodeTextEntry(text: string): Buffer {
  const terminated = text.endsWith("\0") ? text : `${text}\0`;
  const encoded = Buffer.from(terminated, "utf16le");
  if (encoded[0] === 0xff && encoded[1] === 0xfe) {
    return encoded;
  }
  return Buffer.concat([Buffer.from([0xff, 0xfe]), encoded]);
}

export function writeCompiledBytes(s: Script): Buffer {
  // Infer script type from presence of Text opcodes
  const hasTextOpcodes = s.scriptData.some((e) => e.opcode === OP_TEXT);
  s.type = hasTextOpcodes ? ScriptType.Text : ScriptType.Textless;

  const file = new ByteWriter();

  // Header
  file.pushInt32(s.type);
  file.pushInt32(s.type === ScriptType.Text ? 16 : 12);
  if (s.type === ScriptType.Text) {
    file.pushInt32(s.textBlockPos);
  }
  file.pushInt32(s.fileSize);

  const textData = new Map<number, string>();
  if (s.type === ScriptType.Text) {
    s.textEntries = 0;
    // First pass: assign text IDs to all text opcodes
    for (const e of s.scriptData) {
      if (e.opcode === OP_TEXT) {
        textData.set(s.textEntries, e.text ?? "");
        getOpcodeDefinition(e.opcode)?.prepareForCompilation(s, e);
      }
    }
  }

  // Create and insert the Type opcode at the beginning
  const typeEntry: ScriptEntry = { opcode: OP_TYPE, args: [0, 0] };
  getOpcodeDefinition(OP_TYPE)?.prepareForCompilation(s, typeEntry);

  file.push(0x70, typeEntry.opcode);
  file.pushMany(typeEntry.args);

  // Write remaining opcodes (skipping any Type opcodes from the source)
  for (const e of s.scriptData) {
    if (e.opcode === OP_TYPE) {
      continue;
    }
    file.push(0x70, e.opcode);
    file.pushMany(e.args);
  }

  file.padTo4();

  s.textBlockPos = file.length;
  file.setInt32(0x08, s.textBlockPos);

  if (s.type === ScriptType.Textless) {
    s.fileSize = s.textBlockPos;
    return file.toBuffer();
  }

  file.pushInt32(s.textEntries);

  // Text block layout: an offset table (one entry per text, plus an end marker) then the strings
  const encoded: Buffer[] = [];
  const startPoints: number[] = [];
  let total = 8 + s.textEntries * 4;

  for (let i = 0; i < s.textEntries; i++) {
    const bytes = encodeTextEntry(textData.get(i) ?? "\uFFFE");
    encoded.push(bytes);
    startPoints.push(total);
    total += bytes.length;
  }

  for (const startPoint of startPoints) {
    file.pushInt32(startPoint);
  }
  file.pushInt32(total);

  for (const bytes of encoded) {
    file.pushMany(bytes);
  }

  file.padTo4();
  s.fileSize = file.length;
  file.setInt32(0x0c, s.fileSize);

  return file.toBuffer();
}

export async function writeCompiled(s: Script, filename: string): Promise<void> {
  printLine("[write] writing compiled file...");
  await writeFile(filename, writeCompiledBytes(s));
  printLine("[write] done.");
}
