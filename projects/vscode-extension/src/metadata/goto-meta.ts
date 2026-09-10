import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const gotoMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Goto,
  hexcode: "0x34",
  parameters: [
    {
      name: "label",
      description: "16-bit label address to jump to",
    },
  ] as const,
  decorations([label]) {
    return `Jump to ${label}`;
  },
};
