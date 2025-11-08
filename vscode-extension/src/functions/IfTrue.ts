import { FunctionName, LinscriptFunction } from "../enum/function";

export const ifTrue: LinscriptFunction = {
  name: FunctionName.IfTrue,
  opcode: "0x3C",
  parameters: [] as const,
  decorations() {
    return "Then";
  },
};
