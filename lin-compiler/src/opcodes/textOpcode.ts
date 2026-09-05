import type { SourceBuilder } from "../output.js";
import { ParamType } from "../parameter.js";
import { type Script, type ScriptEntry, ScriptType } from "../script.js";
import { BaseOpcode } from "./baseOpcode.js";

export class TextOpcode extends BaseOpcode {
  constructor(name: string, opcode = 0xff) {
    super(name, [ParamType.UInt16BE], opcode);
  }

  override writeSourceArgs(output: SourceBuilder, _script: Script, scriptEntry: ScriptEntry): void {
    // Text opcode: don't show the text ID, it's auto-assigned during compilation
    // Remove BOM (U+FEFF) and null terminator
    let text = trimEnd(trimStart(scriptEntry.text ?? "", "\uFEFF"), "\u0000");

    // Escapes
    text = text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\r", "\\r").replaceAll("\n", "\\n");

    output.append(`"${text}"`);
  }

  override readSource(argsString: string, lineNum: number, script: Script): ScriptEntry[] {
    // Mutate script type and increment number of entries
    script.type = ScriptType.Text;
    script.textEntries++;

    const text = parseQuotedString(argsString, lineNum);

    // Text is manual - just create the Text entry without auto-generating opcodes
    return [{ opcode: this.opcode, text, args: [0, 0] }];
  }

  override prepareForCompilation(script: Script, entry: ScriptEntry): void {
    // Assign text ID for this text entry.
    // Called during the first pass when building the text table.
    // Big-endian: MSB first, LSB second (as required by Text opcode)
    entry.args[0] = (script.textEntries >> 8) & 0xff;
    entry.args[1] = script.textEntries & 0xff;

    script.textEntries++;
  }
}

/** Equivalent of C#'s `string.TrimStart(char)`: strips every leading occurrence of `char`. */
function trimStart(value: string, char: string): string {
  let start = 0;
  while (start < value.length && value[start] === char) {
    start++;
  }
  return value.slice(start);
}

/** Equivalent of C#'s `string.TrimEnd(char)`: strips every trailing occurrence of `char`. */
function trimEnd(value: string, char: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === char) {
    end--;
  }
  return value.slice(0, end);
}

export function parseQuotedString(input: string, lineNum: number): string {
  const trimmed = input.trim();

  // Must start and end with quotes
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    throw new Error(`[read] error: Text opcode expects quoted string at line ${lineNum + 1}`);
  }

  // Remove surrounding quotes
  const content = trimmed.slice(1, -1);

  // Process escape sequences
  let result = "";
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\\" && i + 1 < content.length) {
      const next = content[i + 1];
      switch (next) {
        case "\\":
        case '"':
          result += next;
          i++;
          break;
        case "n":
          result += "\n";
          i++;
          break;
        case "r":
          result += "\r";
          i++;
          break;
        case "t":
          result += "\t";
          i++;
          break;
        default:
          result += content[i];
          break;
      }
    } else {
      result += content[i];
    }
  }

  return result;
}
