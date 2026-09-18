import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const onObjectMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.OnObject,
  hexcode: "0x29",
  parameters: [
    {
      name: "objectId",
      scope: "Object",
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
