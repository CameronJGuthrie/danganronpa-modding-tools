import { Opcode } from "../definitions/opcode.definition.ts";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { formatArgs, formatTextArgument, parseEntry, parseTextArgument } from "./arguments.ts";
import { getOpcodeByName, type OpcodeInfo } from "./lookup.ts";

/**
 * `Option(n, "label")` is source-only sugar for a menu choice: `SetOption(n)` followed by the
 * choice's label as `RawText("label\n")` and one `WaitFrame`. In the game every labelled option
 * has exactly this shape, and the label ends with a newline, which the sugar makes implicit like
 * `Text(...)` does. `SetOption` stays a block opener, so the option's body is indented under the
 * `Option(...)` line just as it is under `SetOption(...)`. The id is a `SetOption` argument, so it
 * may be written by name (`Option(Yes, "Yes")` with `Option(1, Yes)` declared in the `Meta()` block, see `DEFAULT_OPTION_NAMES`).
 *
 * Only a SetOption whose label immediately follows collapses; the handler registrations
 * (`SetOption(18)`, `SetOption(19)`), the closing `SetOption(255)` and options with anything
 * between them and their label are written as plain `SetOption`.
 */

/** Source name of the sugar. */
export const OPTION = "Option";

const setOption = getOpcodeByName("SetOption") as OpcodeInfo;

/** Compile `Option(n, "label")` into its SetOption, RawText and WaitFrame entries. */
export function expandOption(argsText: string, line: number, scopes: ScopeTables): ScriptEntry[] {
  const comma = argsText.indexOf(",");
  if (comma === -1) {
    throw new SourceError(line, `${OPTION} expects 2 arguments (option, label), got ${argsText.trim() === "" ? 0 : 1}`);
  }
  const label = parseTextArgument(argsText.slice(comma + 1), line);
  return [
    parseEntry(setOption, argsText.slice(0, comma), line, scopes),
    { opcode: Opcode.RawText, args: [0, 0], text: `${label}\n` },
    { opcode: Opcode.WaitFrame, args: [] },
  ];
}

/**
 * Indices of the SetOption entries that can be written as `Option(...)`: those directly followed by
 * a text entry ending in a newline and then a WaitFrame. The label and WaitFrame are absorbed.
 */
export function planOptionSugar(entries: readonly ScriptEntry[]): Set<number> {
  const sugared = new Set<number>();
  for (let i = 0; i + 2 < entries.length; i++) {
    const label = entries[i + 1];
    if (
      entries[i].opcode === Opcode.SetOption &&
      entries[i].args.length === 1 &&
      label.opcode === Opcode.RawText &&
      "text" in label &&
      labelText(label.text) !== undefined &&
      entries[i + 2].opcode === Opcode.WaitFrame
    ) {
      sugared.add(i);
    }
  }
  return sugared;
}

/** The argument text of an `Option(...)` for the SetOption at `index`; the plan has checked the shape. */
export function formatOption(
  entries: readonly ScriptEntry[],
  index: number,
  names: boolean,
  scopes: ScopeTables,
): string {
  const label = entries[index + 1];
  const text = "text" in label ? (labelText(label.text) ?? label.text) : "";
  return `${formatArgs(setOption.args, entries[index], { names, scopes })}, ${formatTextArgument(text, names)}`;
}

/** The label without its trailing newline, or undefined when the text does not end in exactly one. */
function labelText(text: string): string | undefined {
  const match = /^(.*?)\n\0*$/s.exec(text.replace(/^﻿+/, ""));
  return match === null || match[1].endsWith("\n") ? undefined : match[1];
}
