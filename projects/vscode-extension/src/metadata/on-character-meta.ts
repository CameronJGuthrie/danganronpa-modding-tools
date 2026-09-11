import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const onCharacterMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.OnCharacter,
  hexcode: "0x27",
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
