import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const thenMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Then,
  hexcode: "0x3C",
  description: "Opens the body of the preceding If, IfFlag, IfFreeTimeEvent or IfRelationship condition.",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
