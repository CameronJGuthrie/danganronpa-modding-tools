import type { ArgumentSpec } from "../definitions/opcode.definition.ts";
import { ParameterType } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { decodeValue, parameterProperties, parseArg, splitArgs } from "../parameter.ts";
import type { OpcodeInfo } from "./lookup.ts";

/**
 * Argument handling for every `ArgumentSpec` kind. `formatArgs` renders an entry's bytes as
 * source and `parseEntry` compiles a source argument list back into an entry.
 */

/** Total argument bytes, or undefined for variadic specs where the reader scans to the next marker. */
export function argByteCount(spec: ArgumentSpec): number | undefined {
  switch (spec.kind) {
    case "fixed":
      return layoutBytes(spec.layout);
    case "text":
    case "type":
      return 2;
    case "repeat":
    case "variadic":
      return undefined;
  }
}

/** Render `entry.args` as the comma-separated argument list used in source. */
export function formatArgs(spec: ArgumentSpec, entry: ScriptEntry): string {
  switch (spec.kind) {
    case "fixed":
      return formatFixed(spec.layout, entry.args);
    case "type":
      return formatFixed([ParameterType.UInt16LE], entry.args);
    case "text":
      return formatQuotedString("text" in entry ? entry.text : "");
    case "variadic":
      return formatRawBytes(entry.args);
    case "repeat": {
      const chained = entry.args.length - layoutBytes(spec.head);
      const tailBytes = layoutBytes(spec.tail);
      if (chained < 0 || chained % tailBytes !== 0) {
        return formatRawBytes(entry.args);
      }
      return formatByLayout(repeatLayout(spec.head, spec.tail, chained / tailBytes), entry.args);
    }
  }
}

/** Compile a source argument list into the entry for `opcode`. */
export function parseEntry(opcode: OpcodeInfo, argsText: string, line: number): ScriptEntry {
  const { id, name, args: spec } = opcode;
  switch (spec.kind) {
    case "fixed":
      return { opcode: id, args: parseFixed(name, spec.layout, argsText, line) };
    case "text":
      return { opcode: id, args: [0, 0], text: parseQuotedString(argsText, line) };
    case "type": {
      // The count is computed on compile; source only needs to name a valid type
      const value = argsText.trim().toLowerCase();
      if (value !== "textless" && value !== "text") {
        throw new SourceError(line, `${name} expects 'Textless' or 'Text', got '${argsText.trim()}'`);
      }
      return { opcode: id, args: [0, 0] };
    }
    case "variadic": {
      const values = splitArgs(argsText);
      if (values.length < spec.min) {
        throw new SourceError(line, `${name} expects at least ${spec.min} arguments, got ${values.length}`);
      }
      return { opcode: id, args: values.flatMap((value) => parseArg(ParameterType.Byte, value, line)) };
    }
    case "repeat": {
      const values = splitArgs(argsText);
      const chained = values.length - spec.head.length;
      if (chained < 0 || chained % spec.tail.length !== 0) {
        throw new SourceError(
          line,
          `${name} expects ${spec.head.length} + ${spec.tail.length}n arguments, got ${values.length}`,
        );
      }
      const layout = repeatLayout(spec.head, spec.tail, chained / spec.tail.length);
      return { opcode: id, args: parseByLayout(layout, values, line) };
    }
  }
}

// ---------------------------------------------------------------------------
// layouts
// ---------------------------------------------------------------------------

function layoutBytes(layout: readonly ParameterType[]): number {
  return layout.reduce((total, type) => total + parameterProperties[type].size, 0);
}

function repeatLayout(head: readonly ParameterType[], tail: readonly ParameterType[], count: number): ParameterType[] {
  const layout = [...head];
  for (let i = 0; i < count; i++) {
    layout.push(...tail);
  }
  return layout;
}

function formatFixed(layout: readonly ParameterType[], args: readonly number[]): string {
  // Malformed entry: keep every byte visible rather than decoding garbage
  return args.length === layoutBytes(layout) ? formatByLayout(layout, args) : formatRawBytes(args);
}

function parseFixed(name: string, layout: readonly ParameterType[], argsText: string, line: number): number[] {
  const values = splitArgs(argsText);
  if (values.length !== layout.length) {
    throw new SourceError(line, `${name} expects ${layout.length} argument(s), got ${values.length}`);
  }
  return parseByLayout(layout, values, line);
}

/** Decode `args` according to `layout` and join the values for source output. */
function formatByLayout(layout: readonly ParameterType[], args: readonly number[]): string {
  const values: string[] = [];
  let offset = 0;
  for (const type of layout) {
    values.push(String(decodeValue(type, args, offset)));
    offset += parameterProperties[type].size;
  }
  return values.join(", ");
}

/** Encode one source value per entry of `layout`. Callers check the counts match first. */
function parseByLayout(layout: readonly ParameterType[], values: readonly string[], line: number): number[] {
  return layout.flatMap((type, i) => parseArg(type, values[i], line));
}

export function formatRawBytes(args: readonly number[]): string {
  return args.join(", ");
}

// ---------------------------------------------------------------------------
// quoted strings
// ---------------------------------------------------------------------------

const BOM = "\uFEFF";
const NUL = "\0";

/** Quote and escape a text entry, dropping any leading byte-order marks and trailing terminators. */
function formatQuotedString(text: string): string {
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
