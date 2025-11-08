import { FunctionName, LinscriptFunction } from "../enum/function";

export const interaction: LinscriptFunction = {
  name: FunctionName.Interaction,
  opcode: "0x29",
  parameters: [
    {
      name: "interactionId",
      values: {
        254: "Exit", // R key in rooms
      },
    },
  ] as const,
};
