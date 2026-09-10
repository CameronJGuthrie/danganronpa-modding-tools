import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * Source-only sugar for Text: the compiler expands AutoText into Text plus the surrounding
 * TextStyle / WaitFrame / WaitInput calls. It has no opcode of its own, so it shares Text's hexcode.
 */
export const autoTextMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.AutoText,
  hexcode: "0x02",
  description:
    "Source-only sugar that expands to Text() with the appropriate TextStyle, WaitFrame and WaitInput calls.",
  parameters: [] as const,
};
