import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * Dialogue text. Source-only sugar: the compiler expands it into RawText plus the surrounding
 * TextStyle / WaitFrame / WaitInput calls, so it shares RawText's hexcode.
 */
export const textMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Text,
  hexcode: "0x02",
  sugar: true,
  description:
    "Displays a line of text and waits for input; expands to RawText with TextStyle, WaitFrame and WaitInput.",
  parameters: [] as const,
};
