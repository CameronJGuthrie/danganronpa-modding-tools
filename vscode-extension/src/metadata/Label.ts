import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const label: OpcodeMeta = {
  name: OpcodeName.Label,
  opcode: "0x2A",
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
