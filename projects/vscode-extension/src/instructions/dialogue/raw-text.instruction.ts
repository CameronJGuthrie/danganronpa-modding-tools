import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * The binary text opcode, written by the decompiler only when `Text(...)` sugar cannot express the
 * surrounding bytes (e.g. a menu option label with no WaitInput). Takes a quoted string.
 */
export const rawTextInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.RawText,
  description: "Displays text with no automatic waits; the compiler assigns the text id.",
  parameters: [] as const,
};
