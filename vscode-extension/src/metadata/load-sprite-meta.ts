import { characterData } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const loadSpriteMeta: OpcodeMeta = {
  name: OpcodeName.LoadSprite,
  opcode: "0x01",
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
