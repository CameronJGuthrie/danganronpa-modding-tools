import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const endOfJumpMeta: OpcodeMeta = {
  name: OpcodeName.EndOfJump,
  opcode: "0x2C",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
