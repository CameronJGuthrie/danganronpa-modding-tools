import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitFrame() calls if you want.
 */
export const waitFrameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.WaitFrame,
  description: "Waits one frame. Text(...) inserts one per newline automatically, so it is rarely needed in source.",
  parameters: [] as const,
};
