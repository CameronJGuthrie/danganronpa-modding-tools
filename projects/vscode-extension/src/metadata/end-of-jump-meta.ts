import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const endOfJumpMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.EndOfJump,
  description: "Opcode 0x2C, seen after jumps. Its two arguments and exact purpose are not yet understood.",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
