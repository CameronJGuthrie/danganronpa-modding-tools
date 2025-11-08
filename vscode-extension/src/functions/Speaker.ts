import { isCharacter } from "../enum/character";
import { characterConfiguration } from "../data/character-data";
import { FunctionName, LinscriptFunction } from "../enum/function";
import { mapProperty } from "../shared/data-util";

export const speaker: LinscriptFunction = {
  name: FunctionName.Speaker,
  opcode: "0x21",
  parameters: [
    {
      name: "characterId",
      values: mapProperty(characterConfiguration, "speakerText"),
    },
  ] as const,
  decorations([character]) {
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown Speaker ID ${character}`, color: "gray" }];
    }
    const { name, color } = characterConfiguration[character];

    return [{ contentText: `Speaker: ${name}`, color }];
  },
};
