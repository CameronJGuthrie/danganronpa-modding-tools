import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const ifTrueMeta: OpcodeMeta = {
  name: OpcodeName.IfTrue,
  opcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
