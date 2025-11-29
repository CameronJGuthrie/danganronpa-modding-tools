import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const ifTrueMeta: OpcodeMeta = {
  name: OpcodeName.IfTrue,
  opcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
