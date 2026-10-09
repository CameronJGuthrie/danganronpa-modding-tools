import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Text the script moves on from by itself. Source-only sugar: `Text` without the WaitInput, and
 * with the string's bytes kept exact rather than gaining an implicit newline.
 */
export const textEagerInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.TextEager,
  sugar: true,
  description:
    "Displays text without waiting for input; expands to RawText with its TextStyle and WaitFrame calls but no WaitInput. The string is exact: no implicit newline, so a \\n is written where the game has one. Used for menu prompts and debate statements. Takes no trailing instructions.",
  parameters: [] as const,
};
