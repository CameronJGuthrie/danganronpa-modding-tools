import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const waitFrameMeta: OpcodeMeta = {
  name: OpcodeName.WaitFrame,
  opcode: "0x3B",
  parameters: [] as const,
};
