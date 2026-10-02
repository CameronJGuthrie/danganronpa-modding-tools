import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const labelInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Label,
  description:
    "Declares a jump target for Goto within this script; named per script with LabelName(id, Name) in Meta().",
  parameters: [
    {
      name: "label",
      description: "16-bit label address",
      scope: "Label",
    },
  ] as const,
  decorations([label]) {
    return `🏷️ ${label}`;
  },
};
