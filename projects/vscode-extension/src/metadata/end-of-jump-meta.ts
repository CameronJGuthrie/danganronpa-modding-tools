import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const endOfJumpMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.EndOfJump,
  hexcode: "0x2C",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
