import { isCharacter, LinscriptInstructionName } from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadSpriteMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadSprite,
  hexcode: "0x01",
  parameters: [
    {
      unknown: true,
      description: "objectId ? mapId ?",
    },
    {
      name: "characterId",
      description: "sometimes characterId",
    },
    {
      unknown: true,
      description: "visibility?",
    },
  ] as const,
  decorations([object, character, visibility]) {
    let characterText = `${character}`;
    if (isCharacter(character)) {
      characterText = characterData[character].name;
    }

    return `${object} ${characterText} ${visibility}`;
  },
};
