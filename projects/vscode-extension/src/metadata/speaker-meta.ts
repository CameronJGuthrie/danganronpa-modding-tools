import { Character, isCharacter, LinscriptInstructionName } from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const speakerMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Speaker,
  hexcode: "0x21",
  selfDescribing: true,
  parameters: [
    {
      names: Character,
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
