import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const ifTrueMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.IfTrue,
  hexcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
