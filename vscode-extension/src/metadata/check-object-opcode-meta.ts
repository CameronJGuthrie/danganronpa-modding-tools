import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const checkObjectMeta: OpcodeMeta = {
  name: OpcodeName.CheckObject,
  hexcode: "0x29",
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
