import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const setOptionMeta: OpcodeMeta = {
  name: OpcodeName.SetOption,
  hexcode: "0x2B",
  parameters: [
    {
      unknown: true,
    },
  ] as const,
};
