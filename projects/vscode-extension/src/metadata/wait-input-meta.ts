import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitInput() calls if you want.
 *
 * TODO: the compiler does not seem to be removing all WaitInput() calls.
 * Either there are just extra ones in the game (no action required) or something may be wrong.
 */
export const waitInputMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.WaitInput,
  hexcode: "0x3A",
  parameters: [] as const,
};
