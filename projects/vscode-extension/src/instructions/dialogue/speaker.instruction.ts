import { Character, characterData, isCharacter, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const speakerInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Speaker,
  description: "Sets the character whose name appears on the following Text lines.",
  selfDescribing: true,
  parameters: [
    {
      name: "character",
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
