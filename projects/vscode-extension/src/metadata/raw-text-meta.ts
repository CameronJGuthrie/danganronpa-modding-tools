import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * The binary text opcode, written by the decompiler only when `Text(...)` sugar cannot express the
 * surrounding bytes (e.g. a menu option label with no WaitInput). Takes a quoted string.
 */
export const rawTextMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.RawText,
  hexcode: "0x02",
  description: "Displays text with no automatic waits; the compiler assigns the text id.",
  parameters: [] as const,
};
