import type { Opcode } from "../definitions/opcode.definition.ts";
import { ParameterType } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { BaseOpcode } from "./baseOpcode.ts";

/**
 * Opcode 0x02 - Text. Its argument is a text id that the compiler assigns sequentially, so
 * source shows the quoted string itself instead.
 */
export class TextOpcode extends BaseOpcode {
  constructor(id: Opcode) {
    super(id, [ParameterType.UInt16BE]);
  }

  override formatArgs(entry: ScriptEntry): string {
    return formatQuotedString("text" in entry ? entry.text : "");
  }

  override parseSource(argsText: string, line: number): ScriptEntry[] {
    return [{ opcode: this.id, args: [0, 0], text: parseQuotedString(argsText, line) }];
  }
}

const BOM = "\uFEFF";
const NUL = "\0";

/** Quote and escape a text entry, dropping any leading byte-order marks and trailing terminators. */
export function formatQuotedString(text: string): string {
  let start = 0;
  while (text[start] === BOM) {
    start++;
  }
  let end = text.length;
  while (end > start && text[end - 1] === NUL) {
    end--;
  }
  const escaped = text
    .slice(start, end)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r", "\\r")
    .replaceAll("\n", "\\n");
  return `"${escaped}"`;
}

const ESCAPES: Record<string, string> = { "\\": "\\", '"': '"', n: "\n", r: "\r", t: "\t" };

/** Parse a double-quoted, backslash-escaped string literal. */
export function parseQuotedString(input: string, line: number): string {
  const trimmed = input.trim();
  if (trimmed.length < 2 || !trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    throw new SourceError(line, "expected a quoted string");
  }
  const content = trimmed.slice(1, -1);

  let result = "";
  for (let i = 0; i < content.length; i++) {
    const replacement = content[i] === "\\" ? ESCAPES[content[i + 1]] : undefined;
    if (replacement === undefined) {
      result += content[i];
    } else {
      result += replacement;
      i++;
    }
  }
  return result;
}
