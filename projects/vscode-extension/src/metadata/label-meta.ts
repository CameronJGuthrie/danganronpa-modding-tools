import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const labelMeta: OpcodeMeta = {
  name: OpcodeName.Label,
  hexcode: "0x2A",
  parameters: [
    {
      name: "label",
      description: "16-bit label address",
    },
  ] as const,
  decorations([label]) {
    return `🏷️ ${label}`;
  },
};
