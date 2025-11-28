import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const interaction: OpcodeMeta = {
  name: OpcodeName.Interaction,
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
