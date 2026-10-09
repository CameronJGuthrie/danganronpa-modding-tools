import { Opcode } from "../definitions/opcode.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { getOpcode } from "./lookup.ts";
import { dropEmptyStyles } from "./textStyles.ts";

/**
 * `Text(...)` in source is sugar for the common dialogue shape
 * `TextStyle* RawText (WaitFrame | TextStyle)* WaitInput`:
 *
 * - the text implicitly ends with a newline: `Text("hi")` is the bytes `hi\n`, with the newline
 *   placed before any closing `<CLT>` tags so `<thought>hi</thought>` is `<CLT 4>hi\n<CLT>`.
 *   A few shipped lines omit that newline or a WaitFrame; they still decompile to `Text`, so
 *   recompiling them normalises the bytes
 * - each `\n` in the text expands to a `WaitFrame`
 * - `<CLT N>` and `<CLT>` colour tags expand to `TextStyle(N)` / `TextStyle(0)`. The tags before
 *   the first character of text are emitted ahead of the RawText itself, so the style applies from
 *   the first character; every tag from the first character on is emitted after it, in order
 *   with the WaitFrames. This is the game's own shape: every shipped text line that has a style
 *   before it has exactly its leading tags there
 * - an empty wrapper, `<keyword></keyword>` with the default style in effect, styles nothing and
 *   is dropped in both directions (`dropEmptyStyles`); the shipped prompts that open with one
 *   recompile a few bytes shorter
 * - further instructions may follow the string, `Text("...", Wait(10), SetUI(Rumble, Hidden))`;
 *   they run after the text has printed and before the `WaitInput` (see `isTrailingEntry`)
 * - a `WaitInput` closes the group
 *
 * `TextEager(...)` is the same shape without the `WaitInput`, for text the script moves on from
 * by itself: menu prompts, debate statements, and lines a later instruction dismisses. It takes
 * no trailing instructions, because nothing marks where they would end, and it adds no implicit
 * newline: the bytes are exactly the string, so a prompt that ends in a newline writes it as `\n`
 * and a debate statement that ends without one writes none.
 *
 * This file owns both directions: `expandText` / `expandTextEager` expand the sugar when
 * compiling and `planTextSugar` recognises collapsible groups when decompiling. The sugar is not
 * a binary opcode; the linscript reader and writer handle the names themselves. A text entry that
 * neither form can express (a trailing instruction the sugar refuses to absorb, a WaitFrame after
 * a trailing instruction, or TextStyles that are not those of the text's own tags) is written as
 * `RawText(...)`.
 */

/** Matches `<CLT N>` opening tags, `<CLT>` closing tags, and literal newlines. */
const CLT_OR_NEWLINE = /<CLT\s+(\d+)>|<CLT>|\n/g;

/** The point where the implicit newline is inserted on compile: before any closing tags. */
const TRAILING_CLOSERS = /(?:<CLT>)*$/;
/** The implicit newline as it appears in raw text: before closing tags and null terminators. */
const IMPLICIT_NEWLINE = /^(.*)\n((?:<CLT>)*)\0*$/s;

/** Source name of the sugar. */
export const TEXT_SUGAR = "Text";
/** Source name of the form without a WaitInput. */
export const TEXT_EAGER = "TextEager";

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
  Opcode.LoadScript,
  Opcode.StopScript,
  Opcode.RunScript,
  Opcode.Return,
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
  return expandRawText(addImplicitNewline(dropEmptyStyles(source)), trailing);
}

/** Compile `TextEager(...)`: the exact bytes of the string, with no implicit newline and no WaitInput. */
export function expandTextEager(source: string): ScriptEntry[] {
  return expandRawText(dropEmptyStyles(source), [], false);
}

/** The entries for the exact bytes `text`, with no implicit newline added. */
function expandRawText(text: string, trailing: readonly ScriptEntry[] = [], waitInput = true): ScriptEntry[] {
  const entries: ScriptEntry[] = [];
  const tokens = [...text.matchAll(CLT_OR_NEWLINE)];

  // The run of colour tags before the first character is emitted ahead of the text so the colour
  // applies from that character; text that opens plain has nothing ahead of it (the game emits no
  // TextStyle(0) there). Every later tag is emitted after the text, in order with the WaitFrames.
  let leading = 0;
  let end = 0;
  while (leading < tokens.length && tokens[leading].index === end && tokens[leading][0] !== "\n") {
    end += tokens[leading][0].length;
    leading++;
  }
  for (const token of tokens.slice(0, leading)) {
    entries.push(textStyle(token[1] === undefined ? 0 : Number(token[1])));
  }
  entries.push({ opcode: Opcode.RawText, args: [0, 0], text });

  for (const token of tokens.slice(leading)) {
    if (token[0] === "\n") {
      entries.push({ opcode: Opcode.WaitFrame, args: [] });
    } else {
      entries.push(textStyle(token[1] === undefined ? 0 : Number(token[1])));
    }
  }

  entries.push(...trailing);
  if (waitInput) {
    entries.push({ opcode: Opcode.WaitInput, args: [] });
  }
  return entries;
}

/** Insert the implicit trailing newline before any closing `<CLT>` tags. */
function addImplicitNewline(source: string): string {
  const closers = TRAILING_CLOSERS.exec(source)?.[0] ?? "";
  return `${source.slice(0, source.length - closers.length)}\n${closers}`;
}

/**
 * The source form of a text entry's raw text: the implicit trailing newline removed when present.
 * Text with no trailing newline at all is its own source form (compiling it adds the newline).
 * Returns undefined when the text ends in a newline that re-adding would not reproduce (e.g.
 * `a<CLT>\n<CLT>`), so the entry cannot be written as `Text(...)`.
 */
export function textSourceForm(text: string): string | undefined {
  const match = IMPLICIT_NEWLINE.exec(text);
  if (match === null) {
    return text;
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
  /** Indices of RawText entries to write as `TextEager(...)`. */
  eager: Set<number>;
  /** Indices of entries absorbed into a sugared Text and therefore not written. */
  skipped: Set<number>;
  /** For each sugared RawText, the indices of the entries written as its trailing instructions. */
  trailing: Map<number, readonly number[]>;
}

/**
 * Find text entries that can be collapsed into the sugar: a RawText (with or without the implicit
 * newline), its leading TextStyle if its bytes expand to one, then a run of WaitFrame and TextStyle
 * entries whose TextStyles are exactly those the bytes expand to, then any run of trailing
 * instructions (see `isTrailingEntry`), then WaitInput. The number of WaitFrames in the run is not
 * checked: a few shipped lines have one fewer than their newlines, and recompiling `Text` emits one
 * per newline, so those lines normalise rather than staying raw.
 *
 * A text entry that is not followed by a WaitInput, or whose newline `Text` cannot make implicit,
 * is written as `TextEager(...)` when its leading TextStyles and exactly the WaitFrames and
 * TextStyles its bytes expand to surround it, so the round trip is byte-exact. Entries in
 * `claimed` (option labels, absorbed by `Option(...)`) are left alone.
 */
export function planTextSugar(entries: readonly ScriptEntry[], claimed: ReadonlySet<number> = new Set()): TextSugarPlan {
  const plan: TextSugarPlan = { sugared: new Set(), eager: new Set(), skipped: new Set(), trailing: new Map() };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.opcode !== Opcode.RawText || !("text" in entry) || claimed.has(i)) {
      continue;
    }
    const text = normalizeText(entry.text);

    // What these exact bytes expand to, minus the WaitInput
    const expected = expandRawText(text).slice(0, -1);
    const leading = expected.findIndex((e) => e.opcode === Opcode.RawText);
    const start = i - leading;
    if (start < 0 || !expected.slice(0, leading).every((e, offset) => sameEntry(entries[start + offset], e))) {
      continue;
    }
    if (textSourceForm(text) === undefined || !planText(entries, i, start, expected.slice(leading + 1), plan)) {
      planEager(entries, i, start, expected.slice(leading + 1), plan);
    }
  }

  return plan;
}

/** Try to plan `Text(...)` for the RawText at `i`; `after` is what its bytes expand to after it. */
function planText(
  entries: readonly ScriptEntry[],
  i: number,
  start: number,
  after: readonly ScriptEntry[],
  plan: TextSugarPlan,
): boolean {
  // The TextStyles after the text must match in order; WaitFrames may be interleaved freely
  const expectedStyles = after.filter((e) => e.opcode === Opcode.TextStyle);
  let next = i + 1;
  let styles = 0;
  while (next < entries.length) {
    const candidate = entries[next];
    if (candidate.opcode === Opcode.WaitFrame) {
      next++;
    } else if (
      candidate.opcode === Opcode.TextStyle &&
      styles < expectedStyles.length &&
      sameEntry(candidate, expectedStyles[styles])
    ) {
      styles++;
      next++;
    } else {
      break;
    }
  }
  if (styles !== expectedStyles.length) {
    return false;
  }

  const trailing: number[] = [];
  let waitInput: number | undefined;
  for (let j = next; j < entries.length; j++) {
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
    return false;
  }

  plan.sugared.add(i);
  plan.trailing.set(i, trailing);
  for (let j = start; j <= waitInput; j++) {
    if (j !== i) {
      plan.skipped.add(j);
    }
  }
  return true;
}

/** Plan `TextEager(...)` for the RawText at `i` when exactly the expected entries follow it. */
function planEager(
  entries: readonly ScriptEntry[],
  i: number,
  start: number,
  after: readonly ScriptEntry[],
  plan: TextSugarPlan,
): void {
  if (!after.every((e, offset) => sameEntry(entries[i + 1 + offset], e))) {
    return;
  }
  plan.eager.add(i);
  for (let j = start; j <= i + after.length; j++) {
    if (j !== i) {
      plan.skipped.add(j);
    }
  }
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
