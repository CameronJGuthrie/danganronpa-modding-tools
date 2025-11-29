import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const typeMeta: OpcodeMeta = {
  name: OpcodeName.Type,
  opcode: "0x00",
  parameters: [
    {
      name: "type",
      values: {
        1: "Textless",
        2: "Text",
      },
    },
  ] as const,
};
