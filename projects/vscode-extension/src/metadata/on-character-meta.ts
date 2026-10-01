import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const onCharacterMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.OnCharacter,
  hexcode: "0x27",
  description:
    "Opens the handler block that runs when the player talks to a placed character; the id is a Sprite slot named with Character(id, Name) in Meta().",
  parameters: [
    {
      name: "characterId",
      scope: "Character",
    },
  ] as const,
  decorations([characterId]) {
    if (characterId === 254) {
      return "---> on Exit";
    }

    if (characterId === 255) {
      return "<---";
    }

    return `---> on ${characterId}`;
  },
};
