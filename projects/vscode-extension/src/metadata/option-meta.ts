import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * A labelled menu choice. Source-only sugar: the compiler expands `Option(n, "label")` into
 * `SetOption(n)`, the label as RawText and a WaitFrame, so it shares SetOption's hexcode.
 */
export const optionMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Option,
  hexcode: "0x2B",
  sugar: true,
  description: "Registers menu choice n with its on-screen label; expands to SetOption(n), RawText and WaitFrame.",
  parameters: [] as const,
};
