import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const gotoMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Goto,
  hexcode: "0x34",
  description: "Jumps to the Label with the same address in this script. Ctrl+Click the call to follow it.",
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
