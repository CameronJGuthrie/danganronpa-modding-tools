import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const ifTrue: OpcodeMeta = {
  name: OpcodeName.IfTrue,
  opcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
