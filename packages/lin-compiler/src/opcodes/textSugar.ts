import { Opcode } from "../definitions/opcode.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";

/**
 * `Text(...)` in source is sugar for the common dialogue shape
 * `[TextStyle] RawText WaitFrame* TextStyle* WaitInput`:
 *
 * - each `\n` in the text expands to a `WaitFrame`
 * - `<CLT N>` and `<CLT>` colour tags expand to `TextStyle(N)` / `TextStyle(0)`, with the
 *   first style also emitted before the RawText itself
 * - a `WaitInput` closes the group
 *
 * This file owns both directions: `expandText` expands the sugar when compiling and
 * `planTextSugar` recognises collapsible groups when decompiling. The sugar is not a binary
 * opcode; the linscript reader and writer handle the name themselves. A text entry that the sugar
 * cannot express (no closing WaitInput, or other opcodes before it) is written as `RawText(...)`.
 */

/** Matches `<CLT N>` opening tags, `<CLT>` closing tags, and literal newlines. */
const CLT_OR_NEWLINE = /<CLT\s+(\d+)>|<CLT>|\n/g;
const HAS_CLT = /<CLT\s+\d+>|<CLT>/;

/** Source name of the sugar. */
export const TEXT_SUGAR = "Text";

export function expandText(text: string): ScriptEntry[] {
  const entries: ScriptEntry[] = [];
  const tokens = [...text.matchAll(CLT_OR_NEWLINE)];
  const first = tokens[0];

  if (HAS_CLT.test(text)) {
    // A leading TextStyle carries the first token's colour when that token is an opening tag,
    // and colour 0 otherwise. It is emitted before the Text so the colour applies from the start.
    entries.push(textStyle(first[1] === undefined ? 0 : Number(first[1])));
  }
  entries.push({ opcode: Opcode.RawText, args: [0, 0], text });

  for (const token of tokens) {
    if (token[0] === "\n") {
      entries.push({ opcode: Opcode.WaitFrame, args: [] });
    } else if (token[0] === "<CLT>") {
      entries.push(textStyle(0));
    } else if (token !== first) {
      // An opening tag; the first one was already emitted ahead of the Text
      entries.push(textStyle(Number(token[1])));
    }
  }

  entries.push({ opcode: Opcode.WaitInput, args: [] });
  return entries;
}

function textStyle(style: number): ScriptEntry {
  return { opcode: Opcode.TextStyle, args: [style & 0xff] };
}

interface TextSugarPlan {
  /** Indices of RawText entries to write as `Text(...)`. */
  sugared: Set<number>;
  /** Indices of entries absorbed into a sugared Text and therefore not written. */
  skipped: Set<number>;
}

/**
 * Find text entries that can be collapsed into the sugar: a RawText followed only by WaitFrame
 * (and TextStyle, when the text carries CLT tags) and terminated by WaitInput.
 */
export function planTextSugar(entries: readonly ScriptEntry[]): TextSugarPlan {
  const plan: TextSugarPlan = { sugared: new Set(), skipped: new Set() };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.opcode !== Opcode.RawText || !("text" in entry)) {
      continue;
    }
    const hasCLT = HAS_CLT.test(entry.text);

    const waitInput = findClosingWaitInput(entries, i + 1, hasCLT);
    if (waitInput === undefined) {
      continue;
    }

    plan.sugared.add(i);
    // A preceding TextStyle belongs to the CLT tags and is regenerated on compile
    if (hasCLT && i > 0 && entries[i - 1].opcode === Opcode.TextStyle) {
      plan.skipped.add(i - 1);
    }
    for (let j = i + 1; j <= waitInput; j++) {
      plan.skipped.add(j);
    }
  }

  return plan;
}

/** Index of the WaitInput closing a RawText, if only sugar opcodes lie between `from` and it. */
function findClosingWaitInput(
  entries: readonly ScriptEntry[],
  from: number,
  allowTextStyle: boolean,
): number | undefined {
  for (let i = from; i < entries.length; i++) {
    const opcode = entries[i].opcode;
    if (opcode === Opcode.WaitInput) {
      return i;
    }
    const isSugar = opcode === Opcode.WaitFrame || (opcode === Opcode.TextStyle && allowTextStyle);
    if (!isSugar) {
      return undefined;
    }
  }
  return undefined;
}
