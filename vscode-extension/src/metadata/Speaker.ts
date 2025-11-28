import { isCharacter } from "../enum/character";
import { characterData } from "../data/character-data";
import { OpcodeName, OpcodeMeta } from "../enum/opcode";
import { mapProperty } from "../util/data-util";

export const speaker: OpcodeMeta = {
  name: OpcodeName.Speaker,
  opcode: "0x21",
  parameters: [
    {
      name: "characterId",
      values: mapProperty(characterData, "speakerText"),
    },
  ] as const,
  decorations([character]) {
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown Speaker ID ${character}`, color: "gray" }];
    }
    const { name, color } = characterData[character];

    return [{ contentText: `Speaker: ${name}`, color }];
  },
};
