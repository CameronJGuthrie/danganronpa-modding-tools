import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setOptionMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetOption,
  hexcode: "0x2B",
  parameters: [
    {
      unknown: true,
    },
  ] as const,
};
