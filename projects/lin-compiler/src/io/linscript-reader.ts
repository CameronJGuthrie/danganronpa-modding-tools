import { readFile } from "node:fs/promises";
import { ParameterType } from "../definitions/parameter.definition.ts";
import type { Script, ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { parseEntry, parseQuotedString } from "../opcodes/arguments.ts";
import { AUTO_TEXT, expandAutoText } from "../opcodes/autoText.ts";
import { getOpcodeByName, parseHexOpcodeName } from "../opcodes/lookup.ts";
import { parseArg, splitArgs } from "../parameter.ts";

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
  if (name === AUTO_TEXT) {
    return expandAutoText(parseQuotedString(argsText, line));
  }
  const opcode = getOpcodeByName(name);
  if (opcode !== undefined) {
    return [parseEntry(opcode, argsText, line)];
  }

  // An unregistered `0xNN(a, b, c)` is written by the decompiler for unknown opcodes; take its bytes verbatim
  const rawId = parseHexOpcodeName(name);
  if (rawId !== undefined) {
    const args = splitArgs(argsText).flatMap((value) => parseArg(ParameterType.Byte, value, line));
    return [{ opcode: rawId, args }];
  }

  throw new SourceError(line, `unknown opcode '${name}'`);
}

function splitLines(source: string): string[] {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  return text.split(/\r\n|\r|\n/);
}
