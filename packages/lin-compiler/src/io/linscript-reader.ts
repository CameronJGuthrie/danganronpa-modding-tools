import { readFile } from "node:fs/promises";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { Script, ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { parseEntry, parseTextArgument } from "../opcodes/arguments.ts";
import { getOpcodeByName } from "../opcodes/lookup.ts";
import { META, parseMeta, type SourceLine, scopeTables } from "../opcodes/meta.ts";
import { expandOption, OPTION } from "../opcodes/option.ts";
import { expandPresent, isPresentSugarName } from "../opcodes/present.ts";
import { expandText, isTrailingEntry, TEXT_SUGAR } from "../opcodes/textSugar.ts";
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
    const { text, trailing } = splitTextSugarArgs(argsText, line);
    return expandText(
      parseTextArgument(text, line),
      trailing.flatMap((call) => parseTrailingCall(call, line, scopes)),
    );
  }
  if (name === WAIT) {
    return [expandWait(argsText, line)];
  }
  if (name === OPTION) {
    return expandOption(argsText, line, scopes);
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

/** A trailing instruction of `Text(...)`, parsed like a line of its own but restricted to what the sugar can absorb. */
function parseTrailingCall(call: string, line: number, scopes: ScopeTables): ScriptEntry[] {
  const match = OPCODE_LINE.exec(call);
  if (match === null) {
    throw new SourceError(line, `invalid instruction after ${TEXT_SUGAR} string: ${call}`);
  }
  const [, name, argsText] = match;
  if (name === TEXT_SUGAR) {
    throw new SourceError(line, `${TEXT_SUGAR} cannot be nested inside ${TEXT_SUGAR}`);
  }
  const entries = parseOpcodeLine(name, argsText, line, scopes);
  for (const entry of entries) {
    if (!isTrailingEntry(entry)) {
      throw new SourceError(line, `${name} cannot follow the string in ${TEXT_SUGAR}(...); write it on its own line`);
    }
  }
  return entries;
}

/**
 * Split the argument text of `Text(...)` into its quoted string and the trailing instruction calls
 * after it, which are separated by top-level commas: `"hi", Wait(10), SetUI(Rumble, Hidden)`.
 */
function splitTextSugarArgs(argsText: string, line: number): { text: string; trailing: string[] } {
  const source = argsText.trim();
  if (!source.startsWith('"')) {
    throw new SourceError(line, "expected a quoted string");
  }
  let i = 1;
  while (i < source.length && source[i] !== '"') {
    i += source[i] === "\\" ? 2 : 1;
  }
  if (i >= source.length) {
    throw new SourceError(line, "unterminated string");
  }
  const text = source.slice(0, i + 1);

  const trailing: string[] = [];
  let rest = source.slice(i + 1).trim();
  while (rest.length > 0) {
    if (!rest.startsWith(",")) {
      throw new SourceError(line, `unexpected '${rest}' after ${TEXT_SUGAR} string`);
    }
    rest = rest.slice(1).trim();
    // A call ends at its matching close paren; commas inside it belong to its own arguments
    let depth = 0;
    let end = -1;
    for (let k = 0; k < rest.length; k++) {
      if (rest[k] === "(") {
        depth++;
      } else if (rest[k] === ")" && --depth === 0) {
        end = k + 1;
        break;
      }
    }
    if (end === -1) {
      throw new SourceError(line, `unterminated instruction after ${TEXT_SUGAR} string: ${rest}`);
    }
    trailing.push(rest.slice(0, end));
    rest = rest.slice(end).trim();
  }
  return { text, trailing };
}

function splitLines(source: string): string[] {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  return text.split(/\r\n|\r|\n/);
}
