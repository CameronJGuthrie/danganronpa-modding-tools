import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitInput() calls if you want.
 *
 * TODO: the compiler does not seem to be removing all WaitInput() calls.
 * Either there are just extra ones in the game (no action required) or something may be wrong.
 */
export const waitInputInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.WaitInput,
  description:
    "Waits for the player to press a button. Text(...) inserts one after each line automatically, so it is rarely needed in source.",
  parameters: [] as const,
};
