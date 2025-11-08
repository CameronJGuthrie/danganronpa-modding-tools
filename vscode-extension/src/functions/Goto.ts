import { FunctionName, LinscriptFunction } from "../enum/function";

export const goto: LinscriptFunction = {
  name: FunctionName.Goto,
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
