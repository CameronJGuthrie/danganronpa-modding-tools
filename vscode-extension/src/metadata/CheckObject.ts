import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const checkObject: OpcodeMeta = {
  name: OpcodeName.CheckObject,
  opcode: "0x29",
  parameters: [
    {
      name: "objectId",
    },
  ] as const,
  decorations([objectId]) {
    if (objectId === 254) {
      return "---> on Exit";
    }

    if (objectId === 255) {
      return "<---";
    }

    return `---> on ${objectId}`;
  },
};
