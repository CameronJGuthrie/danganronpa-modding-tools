import { readFile } from "node:fs/promises";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { Script, ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { parseEntry, parseTextArgument } from "../opcodes/arguments.ts";
import { getOpcodeByName } from "../opcodes/lookup.ts";
import { META, parseMeta, scopeTables, type SourceLine } from "../opcodes/meta.ts";
import { expandPresent, isPresentSugarName } from "../opcodes/present.ts";
import { expandText, TEXT_SUGAR } from "../opcodes/textSugar.ts";
import { expandWait, WAIT } from "../opcodes/wait.ts";

/** Matches `OpcodeName(args)`, capturing the name and the raw argument text. */
const OPCODE_LINE = /^(\w+)\s*\((.*)\)$/;

/**
 * Parse `.linscript` source text. Blank lines and `#` comments are ignored. A `Meta()` block ends
 * the instructions; it is read first so the names it declares can be used above it.
 */
export function readSource(source: string): Script {
  const lines: SourceLine[] = [];
  splitLines(source).forEach((rawLine, index) => {
    const text = rawLine.trim();
    if (text.length > 0 && !text.startsWith("#")) {
      lines.push({ line: index + 1, text });
    }
  });

  const metaIndex = lines.findIndex(({ text }) => /^Meta\s*\(\s*\)$/.test(text));
  const meta = metaIndex === -1 ? undefined : parseMeta(lines.slice(metaIndex + 1));
  const scopes = scopeTables(meta);

  const entries: ScriptEntry[] = [];
  for (const { line, text } of metaIndex === -1 ? lines : lines.slice(0, metaIndex)) {
    const match = OPCODE_LINE.exec(text);
    if (match === null) {
      throw new SourceError(line, `invalid syntax: ${text}`);
    }
    const [, name, argsText] = match;
    entries.push(...parseOpcodeLine(name, argsText, line, scopes));
  }

  return meta === undefined ? { entries } : { entries, meta };
}

export async function readSourceFile(path: string): Promise<Script> {
  return readSource(await readFile(path, "utf8"));
}

function parseOpcodeLine(name: string, argsText: string, line: number, scopes: ScopeTables): ScriptEntry[] {
  if (name === TEXT_SUGAR) {
    return expandText(parseTextArgument(argsText, line));
  }
  if (name === WAIT) {
    return [expandWait(argsText, line)];
  }
  if (isPresentSugarName(name)) {
    return [expandPresent(name, argsText, line)];
  }
  const opcode = getOpcodeByName(name);
  if (opcode !== undefined) {
    if (opcode.hidden) {
      throw new SourceError(line, `'${name}' is not a source instruction; use its sugar instead`);
    }
    return [parseEntry(opcode, argsText, line, scopes)];
  }
  if (name === META) {
    throw new SourceError(line, `${META}() takes no arguments and must be the last block in the file`);
  }

  // Hex names (`0xNN`) are decompiler output for unknown opcodes and `--hex` mode; source cannot use them
  throw new SourceError(line, `unknown opcode '${name}'`);
}

function splitLines(source: string): string[] {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  return text.split(/\r\n|\r|\n/);
}
