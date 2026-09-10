import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const labelMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Label,
  hexcode: "0x2A",
  parameters: [
    {
      name: "label",
      description: "16-bit label address",
    },
  ] as const,
  decorations([label]) {
    return `🏷️ ${label}`;
  },
};
