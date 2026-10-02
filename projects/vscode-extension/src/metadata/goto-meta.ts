import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const gotoMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Goto,
  hexcode: "0x34",
  description:
    "Jumps to the Label with the same address in this script, on its own line or as the branch of an If* condition. Ctrl+Click the call to follow it.",
  parameters: [
    {
      name: "label",
      description: "16-bit label address to jump to",
      scope: "Label",
    },
  ] as const,
  decorations([label]) {
    return `Jump to ${label}`;
  },
};
