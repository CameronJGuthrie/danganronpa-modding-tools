import { characterData } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";
import { mapProperty } from "../util/data-util";

export const speakerMeta: OpcodeMeta = {
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
