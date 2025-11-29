import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const waitInputMeta: OpcodeMeta = {
  name: OpcodeName.WaitInput,
  hexcode: "0x3A",
  parameters: [] as const,
};
