import { readFile } from "node:fs/promises";
import { OP_TEXT } from "./opcodes/ids.ts";
import { getOpcodeArgCount, getOpcodeDefinitionByName } from "./opcodes/opcodeDictionary.ts";
import { printLine, toHexOpcode } from "./options.ts";
import { type Script, type ScriptEntry, ScriptType } from "./script.ts";

/** Matches `OpcodeName(args)` or `0xNN(args)`, capturing the name and the raw argument text. */
const OPCODE_PATTERN = /^\s*(\w+|0x[0-9A-Fa-f]+)\s*\((.*)\)\s*$/;

/** Marks the start of every opcode in the compiled script data. */
const OPCODE_MARKER = 0x70;

export function readSourceText(script: Script, source: string): void {
  // Default script type is textless
  script.type = ScriptType.Textless;
  printLine("[read] reading source file...");

  const lines = splitLines(source);
  const scriptData: ScriptEntry[] = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].trim();
    if (line.length === 0) {
      continue;
    }

    // Skip comment lines
    if (line.startsWith("#")) {
      continue;
    }

    const match = OPCODE_PATTERN.exec(line);
    if (match === null) {
      throw new Error(`[read] error: invalid syntax at line ${lineNum + 1}: ${line}`);
    }

    const [, opcodeName, argsString] = match;

    const opcodeDefinition = getOpcodeDefinitionByName(opcodeName);
    if (opcodeDefinition === null) {
      throw new Error(`[read] error: unknown opcode '${opcodeName}' at line ${lineNum + 1}`);
    }
    scriptData.push(...opcodeDefinition.readSource(argsString, lineNum, script));
  }

  script.scriptData = scriptData;
}

export async function readSource(script: Script, filename: string): Promise<void> {
  readSourceText(script, await readFile(filename, "utf8"));
}

function splitLines(source: string): string[] {
  // Strip the UTF-8 BOM, as .NET's StreamReader does, then split on any line ending
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const lines = text.split(/\r\n|\r|\n/);
  // A trailing newline does not produce a final empty line in File.ReadAllLines
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

export function readCompiled(s: Script, fileBytes: Uint8Array): void {
  printLine("[read] reading compiled file...");
  s.file = fileBytes;
  const view = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
  const int32 = (offset: number) => view.getInt32(offset, true);

  printLine("[read] reading header...");
  s.type = int32(0x0) as ScriptType;
  s.headerSize = int32(0x4);
  switch (s.type) {
    case ScriptType.Textless:
      s.fileSize = int32(0x8);
      if (s.fileSize === 0) {
        s.fileSize = fileBytes.length;
      }
      s.textBlockPos = s.fileSize;
      s.scriptData = readScriptData(s);
      break;
    case ScriptType.Text:
      s.textBlockPos = int32(0x8);
      s.fileSize = int32(0xc);
      if (s.fileSize === 0) {
        s.fileSize = fileBytes.length;
      }
      s.scriptData = readScriptData(s);
      s.textEntries = int32(s.textBlockPos);
      readTextEntries(s, int32);
      break;
    default:
      throw new Error("[read] error: unknown script type.");
  }
}

export async function readCompiledFile(script: Script, filename: string): Promise<void> {
  readCompiled(script, await readFile(filename));
}

function readScriptData(s: Script): ScriptEntry[] {
  printLine("[read] reading script data...");
  const scriptData: ScriptEntry[] = [];

  for (let i = s.headerSize; i < s.textBlockPos; i++) {
    if (s.file[i] !== OPCODE_MARKER) {
      // EOF - the remainder must be zero padding
      while (i < s.textBlockPos) {
        if (s.file[i] !== 0x00) {
          throw new Error(`[read] error: expected 0x70, got ${toHexOpcode(s.file[i])}.`);
        }
        i++;
      }
      return scriptData;
    }

    i++;
    const entry: ScriptEntry = { opcode: s.file[i], args: [] };

    const argCount = getOpcodeArgCount(entry.opcode);
    if (argCount === -1) {
      // Vararg: consume bytes until the next opcode marker
      while (s.file[i + 1] !== OPCODE_MARKER) {
        entry.args.push(s.file[i + 1]);
        i++;
      }
    } else {
      for (let a = 0; a < argCount; a++) {
        entry.args.push(s.file[i + 1]);
        i++;
      }
    }
    scriptData.push(entry);
  }

  return scriptData;
}

function readTextEntries(s: Script, int32: (offset: number) => number): void {
  printLine("[read] reading text entries...");
  const buffer = Buffer.from(s.file.buffer, s.file.byteOffset, s.file.byteLength);

  for (const entry of s.scriptData) {
    if (entry.opcode !== OP_TEXT) {
      entry.text = null;
      continue;
    }

    // Big-endian: MSB first, LSB second (as stored in file)
    const textId = (entry.args[0] << 8) | entry.args[1];

    if (textId >= s.textEntries) {
      throw new Error("[read] error: text id out of range.");
    }

    const textPos = int32(s.textBlockPos + (textId + 1) * 4);
    const nextTextPos =
      textId === s.textEntries - 1 ? s.fileSize - s.textBlockPos : int32(s.textBlockPos + (textId + 2) * 4);

    const start = s.textBlockPos + textPos;
    const text = buffer.toString("utf16le", start, start + (nextTextPos - textPos));
    // Drop a byte-reversed BOM if one leads the entry
    entry.text = text.startsWith("\uFFFE") ? text.slice(1) : text;
  }
}
