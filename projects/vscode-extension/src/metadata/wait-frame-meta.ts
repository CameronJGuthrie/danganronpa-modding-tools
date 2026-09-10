import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitFrame() calls if you want.
 */
export const waitFrameMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.WaitFrame,
  hexcode: "0x3B",
  parameters: [] as const,
};
