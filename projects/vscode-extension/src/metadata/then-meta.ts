import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const thenMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Then,
  hexcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
