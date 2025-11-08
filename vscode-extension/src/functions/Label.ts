import { FunctionName, LinscriptFunction } from "../enum/function";

export const label: LinscriptFunction = {
  name: FunctionName.Label,
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
