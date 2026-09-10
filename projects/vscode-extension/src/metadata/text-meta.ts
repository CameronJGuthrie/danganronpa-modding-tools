import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * Displays a line of dialogue. The argument is a quoted string rather than numbers, so the
 * numeric-argument decorations never match it; it is listed so that every opcode has metadata.
 */
export const textMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Text,
  hexcode: "0x02",
  description: "Displays a line of text. Takes a quoted string in source; the compiler assigns the text id.",
  parameters: [] as const,
};
