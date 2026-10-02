import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/**
 * A labelled menu choice. Source-only sugar: the compiler expands `Option(n, "label")` into
 * `SetOption(n)`, the label as RawText and a WaitFrame.
 */
export const optionInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Option,
  sugar: true,
  description: "Registers menu choice n with its on-screen label; expands to SetOption(n), RawText and WaitFrame.",
  parameters: [] as const,
};
