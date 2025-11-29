import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const gotoMeta: OpcodeMeta = {
  name: OpcodeName.Goto,
  opcode: "0x34",
  parameters: [
    {
      name: "label",
      description: "16-bit label address to jump to",
    },
  ] as const,
  decorations([label]) {
    return `Jump to ${label}`;
  },
};
