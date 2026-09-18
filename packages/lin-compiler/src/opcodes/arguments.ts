import type { ArgumentSpec } from "../definitions/opcode.definition.ts";
import {
  type NamedValues,
  nameOfValue,
  namesFor,
  type Parameter,
  ParameterType,
  parameterTypeOf,
  type ScopeTables,
  valueOfName,
} from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { decodeValue, encodeValue, parameterProperties, parseArg, splitArgs } from "../parameter.ts";
import type { OpcodeInfo } from "./lookup.ts";
import { formatStyledText, parseStyledText } from "./textStyles.ts";

/**
 * Argument handling for every `ArgumentSpec` kind. `formatArgs` renders an entry's bytes as
 * source and `parseEntry` compiles a source argument list back into an entry.
 */

export interface FormatArgsOptions {
  /**
   * Write named parameter values (see `Parameter`) by name rather than number, and text style
   * tags in their sugared form rather than raw `<CLT>`. Defaults to true.
   */
  names?: boolean;
  /** Per-script name tables for scoped parameters, e.g. the object names from a `Meta()` block. */
  scopes?: ScopeTables;
}

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
export function formatArgs(spec: ArgumentSpec, entry: ScriptEntry, options: FormatArgsOptions = {}): string {
  const names = options.names ?? true;
  const scopes = options.scopes ?? {};
  switch (spec.kind) {
    case "fixed":
      return formatFixed(spec.layout, entry.args, names, scopes);
    case "type":
      return formatFixed([ParameterType.UInt16LE], entry.args, names, scopes);
    case "text":
      return formatTextArgument("text" in entry ? entry.text : "", names);
    case "variadic":
      return formatRawBytes(entry.args);
    case "repeat": {
      const chained = entry.args.length - layoutBytes(spec.head);
      const tailBytes = layoutBytes(spec.tail);
      if (chained < 0 || chained % tailBytes !== 0) {
        return formatRawBytes(entry.args);
      }
      return formatByLayout(repeatLayout(spec.head, spec.tail, chained / tailBytes), entry.args, names, scopes);
    }
  }
}

/** Compile a source argument list into the entry for `opcode`. */
export function parseEntry(opcode: OpcodeInfo, argsText: string, line: number, scopes: ScopeTables = {}): ScriptEntry {
  const { id, name, args: spec } = opcode;
  switch (spec.kind) {
    case "fixed":
      return { opcode: id, args: parseFixed(name, spec.layout, argsText, line, scopes) };
    case "text":
      return { opcode: id, args: [0, 0], text: parseTextArgument(argsText, line) };
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
      return { opcode: id, args: parseByLayout(layout, values, line, scopes) };
    }
  }
}

// ---------------------------------------------------------------------------
// layouts
// ---------------------------------------------------------------------------

function layoutBytes(layout: readonly Parameter[]): number {
  return layout.reduce((total, parameter) => total + parameterProperties[parameterTypeOf(parameter)].size, 0);
}

function repeatLayout(head: readonly Parameter[], tail: readonly Parameter[], count: number): Parameter[] {
  const layout = [...head];
  for (let i = 0; i < count; i++) {
    layout.push(...tail);
  }
  return layout;
}

function formatFixed(layout: readonly Parameter[], args: readonly number[], names: boolean, scopes: ScopeTables): string {
  // Malformed entry: keep every byte visible rather than decoding garbage
  return args.length === layoutBytes(layout) ? formatByLayout(layout, args, names, scopes) : formatRawBytes(args);
}

function parseFixed(
  name: string,
  layout: readonly Parameter[],
  argsText: string,
  line: number,
  scopes: ScopeTables,
): number[] {
  const values = splitArgs(argsText);
  if (values.length !== layout.length) {
    throw new SourceError(line, `${name} expects ${layout.length} argument(s), got ${values.length}`);
  }
  return parseByLayout(layout, values, line, scopes);
}

/** Decode `args` according to `layout` and join the values for source output. */
function formatByLayout(
  layout: readonly Parameter[],
  args: readonly number[],
  names: boolean,
  scopes: ScopeTables,
): string {
  const rendered: string[] = [];
  const decoded: number[] = [];
  let offset = 0;
  layout.forEach((parameter, index) => {
    const type = parameterTypeOf(parameter);
    const value = decodeValue(type, args, offset);
    decoded.push(value);
    // Values without a name (e.g. an unresearched speaker id) stay numeric so nothing is hidden
    const table = names ? namesFor(parameter, index, decoded, scopes) : undefined;
    const name = table === undefined ? undefined : nameOfValue(table, value);
    rendered.push(name ?? String(value));
    offset += parameterProperties[type].size;
  });
  return rendered.join(", ");
}

/** Encode one source value per entry of `layout`. Callers check the counts match first. */
function parseByLayout(
  layout: readonly Parameter[],
  values: readonly string[],
  line: number,
  scopes: ScopeTables,
): number[] {
  const bytes: number[] = [];
  const decoded: number[] = [];
  layout.forEach((parameter, index) => {
    const type = parameterTypeOf(parameter);
    const encoded = parseParameter(type, namesFor(parameter, index, decoded, scopes), values[index], line);
    decoded.push(decodeValue(type, encoded, 0));
    bytes.push(...encoded);
  });
  return bytes;
}

const IDENTIFIER = /^[A-Za-z_]\w*$/;

/**
 * Parse one source value. A named parameter accepts any entry of its name table (identifiers such
 * as `Makoto`, or symbols such as `<=`) as well as the plain number.
 */
function parseParameter(type: ParameterType, names: NamedValues | undefined, text: string, line: number): number[] {
  const trimmed = text.trim();
  if (names !== undefined) {
    const value = valueOfName(names, trimmed);
    if (value !== undefined) {
      return encodeValue(type, value);
    }
    if (IDENTIFIER.test(trimmed)) {
      throw new SourceError(line, `unknown name '${trimmed}' for ${type} argument`);
    }
  }
  return parseArg(type, text, line);
}

export function formatRawBytes(args: readonly number[]): string {
  return args.join(", ");
}

// ---------------------------------------------------------------------------
// quoted strings
// ---------------------------------------------------------------------------

/** Render game text as a quoted source string, with style tags sugared unless `names` is false. */
export function formatTextArgument(text: string, names = true): string {
  return formatQuotedString(names ? formatStyledText(text) : text);
}

/** Parse a quoted source string into game text, compiling style tag sugar back to `<CLT>`. */
export function parseTextArgument(argsText: string, line: number): string {
  return parseStyledText(parseQuotedString(argsText, line), line);
}

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
