import { Opcode } from "../definitions/opcode.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { getOpcode } from "./lookup.ts";

/**
 * `Text(...)` in source is sugar for the common dialogue shape
 * `[TextStyle] RawText WaitFrame* TextStyle* WaitInput`:
 *
 * - the text implicitly ends with a newline: `Text("hi")` is the bytes `hi\n`, with the newline
 *   placed before any closing `<CLT>` tags so `<thought>hi</thought>` is `<CLT 4>hi\n<CLT>`
 * - each `\n` in the text expands to a `WaitFrame`
 * - `<CLT N>` and `<CLT>` colour tags expand to `TextStyle(N)` / `TextStyle(0)`; when the text
 *   opens with a tag that style is also emitted before the RawText itself, as the game does
 * - further instructions may follow the string, `Text("...", Wait(10), SetUI(Rumble, Hidden))`;
 *   they run after the text has printed and before the `WaitInput` (see `isTrailingEntry`)
 * - a `WaitInput` closes the group
 *
 * This file owns both directions: `expandText` expands the sugar when compiling and
 * `planTextSugar` recognises collapsible groups when decompiling. The sugar is not a binary
 * opcode; the linscript reader and writer handle the name themselves. A text entry that the sugar
 * cannot express (no trailing newline, no closing WaitInput, WaitFrames that do not match the
 * newlines, or a trailing instruction the sugar refuses to absorb) is written as `RawText(...)`.
 */

/** Matches `<CLT N>` opening tags, `<CLT>` closing tags, and literal newlines. */
const CLT_OR_NEWLINE = /<CLT\s+(\d+)>|<CLT>|\n/g;

/** The point where the implicit newline is inserted on compile: before any closing tags. */
const TRAILING_CLOSERS = /(?:<CLT>)*$/;
/** The implicit newline as it appears in raw text: before closing tags and null terminators. */
const IMPLICIT_NEWLINE = /^(.*)\n((?:<CLT>)*)\0*$/s;

/** Source name of the sugar. */
export const TEXT_SUGAR = "Text";

/**
 * Opcodes that may never be written as trailing `Text(...)` instructions: the pieces of the sugar
 * itself, control flow (which would hide jumps and labels inside a dialogue line) and block
 * openers (whose indentation the writer tracks per line). Unknown opcodes have no source name.
 */
const NOT_TRAILING: ReadonlySet<number> = new Set<number>([
  Opcode.Type,
  Opcode.RawText,
  Opcode.TextStyle,
  Opcode.WaitFrame,
  Opcode.WaitInput,
  Opcode.Label,
  Opcode.Goto,
  Opcode.EndOfJump,
  Opcode.LoadScript,
  Opcode.StopScript,
  Opcode.RunScript,
  Opcode.RestartScript,
  Opcode.If,
  Opcode.IfFlag,
  Opcode.IfFreeTimeEvent,
  Opcode.IfRelationship,
  Opcode.Then,
]);

/** True when `entry` may be written as a trailing instruction of `Text(...)`. */
export function isTrailingEntry(entry: ScriptEntry): boolean {
  const opcode = getOpcode(entry.opcode);
  return opcode !== undefined && !opcode.block && !NOT_TRAILING.has(entry.opcode);
}

/**
 * Compile the sugar. `trailing` are the entries of the instructions written after the string;
 * they are placed after the text's own WaitFrame/TextStyle entries and before the WaitInput.
 */
export function expandText(source: string, trailing: readonly ScriptEntry[] = []): ScriptEntry[] {
  const text = addImplicitNewline(source);
  const entries: ScriptEntry[] = [];
  const tokens = [...text.matchAll(CLT_OR_NEWLINE)];
  const first = tokens[0];

  // Text that opens with a colour tag has that TextStyle emitted ahead of it so the colour applies
  // from the first character; text that opens plain has nothing ahead of it (the game emits no
  // TextStyle(0) there). Every tag is then emitted again in sequence.
  const opening = first !== undefined && first.index === 0 && first[1] !== undefined;
  if (opening) {
    entries.push(textStyle(Number(first[1])));
  }
  entries.push({ opcode: Opcode.RawText, args: [0, 0], text });

  for (const token of tokens) {
    if (token[0] === "\n") {
      entries.push({ opcode: Opcode.WaitFrame, args: [] });
    } else if (token[0] === "<CLT>") {
      entries.push(textStyle(0));
    } else if (!(opening && token === first)) {
      entries.push(textStyle(Number(token[1])));
    }
  }

  entries.push(...trailing);
  entries.push({ opcode: Opcode.WaitInput, args: [] });
  return entries;
}

/** Insert the implicit trailing newline before any closing `<CLT>` tags. */
function addImplicitNewline(source: string): string {
  const closers = TRAILING_CLOSERS.exec(source)?.[0] ?? "";
  return `${source.slice(0, source.length - closers.length)}\n${closers}`;
}

/**
 * The source form of a sugared text entry's raw text: the implicit trailing newline removed.
 * Returns undefined when the text has no such newline, or when re-adding it would not reproduce
 * the same bytes (e.g. `a<CLT>\n<CLT>`), so the entry cannot be written as `Text(...)`.
 */
export function stripImplicitNewline(text: string): string | undefined {
  const match = IMPLICIT_NEWLINE.exec(text);
  if (match === null) {
    return undefined;
  }
  const stripped = match[1] + match[2];
  return addImplicitNewline(stripped) === text.replace(/\0*$/, "") ? stripped : undefined;
}

function textStyle(style: number): ScriptEntry {
  return { opcode: Opcode.TextStyle, args: [style & 0xff] };
}

interface TextSugarPlan {
  /** Indices of RawText entries to write as `Text(...)`. */
  sugared: Set<number>;
  /** Indices of entries absorbed into a sugared Text and therefore not written. */
  skipped: Set<number>;
  /** For each sugared RawText, the indices of the entries written as its trailing instructions. */
  trailing: Map<number, readonly number[]>;
}

/**
 * Find text entries that can be collapsed into the sugar: a RawText ending in the implicit newline,
 * followed by exactly the WaitFrame and TextStyle entries `expandText` would produce for it, then
 * any run of trailing instructions (see `isTrailingEntry`), then WaitInput.
 */
export function planTextSugar(entries: readonly ScriptEntry[]): TextSugarPlan {
  const plan: TextSugarPlan = { sugared: new Set(), skipped: new Set(), trailing: new Map() };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.opcode !== Opcode.RawText || !("text" in entry)) {
      continue;
    }
    const stripped = stripImplicitNewline(normalizeText(entry.text));
    if (stripped === undefined) {
      continue;
    }

    // What compiling `Text(stripped)` would emit, minus its WaitInput; the group must match it exactly
    const expected = expandText(stripped).slice(0, -1);
    const leading = expected.findIndex((e) => e.opcode === Opcode.RawText);
    const start = i - leading;
    if (start < 0 || !expected.every((e, offset) => sameEntry(entries[start + offset], e))) {
      continue;
    }

    const trailing: number[] = [];
    let waitInput: number | undefined;
    for (let j = start + expected.length; j < entries.length; j++) {
      if (entries[j].opcode === Opcode.WaitInput) {
        waitInput = j;
        break;
      }
      if (!isTrailingEntry(entries[j])) {
        break;
      }
      trailing.push(j);
    }
    if (waitInput === undefined) {
      continue;
    }

    plan.sugared.add(i);
    plan.trailing.set(i, trailing);
    for (let j = start; j <= waitInput; j++) {
      if (j !== i) {
        plan.skipped.add(j);
      }
    }
  }

  return plan;
}

/** Compiled text without the byte-order marks and null terminators the binary carries. */
function normalizeText(text: string): string {
  return text.replace(/^\uFEFF+/, "").replace(/\0*$/, "");
}

/**
 * True when two entries are the same instruction. Text entries compare by text alone, since their
 * argument bytes are a text id assigned on compile; everything else compares argument bytes.
 */
function sameEntry(actual: ScriptEntry | undefined, expected: ScriptEntry): boolean {
  if (actual === undefined || actual.opcode !== expected.opcode) {
    return false;
  }
  if ("text" in expected) {
    return "text" in actual && normalizeText(actual.text) === expected.text;
  }
  return actual.args.length === expected.args.length && actual.args.every((byte, i) => byte === expected.args[i]);
}
