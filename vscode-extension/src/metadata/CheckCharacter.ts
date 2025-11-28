import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const checkCharacter: OpcodeMeta = {
  name: OpcodeName.CheckCharacter,
  opcode: "0x27",
  parameters: [
    {
      name: "objectId",
    }
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
