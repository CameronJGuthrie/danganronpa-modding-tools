import { characterConfiguration } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { FunctionName, LinscriptFunction } from "../enum/function";

export const loadSprite: LinscriptFunction = {
  name: FunctionName.LoadSprite,
  opcode: "0x01",
  parameters: [
    {
      unknown: true,
      description: "objectId ? mapId ?"
    },
    {
      name: "characterId",
      description: "sometimes characterId"
    },
    {
      unknown: true,
      description: "visibility?"
    },
  ] as const,
  decorations([object, character, visibility]) {
    let characterText = `${character}`;
    if (isCharacter(character)) {
      characterText = characterConfiguration[character].name;
    }

    return `${object} ${characterText} ${visibility}`;
  },
};
