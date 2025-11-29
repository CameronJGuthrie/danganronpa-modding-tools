import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

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
