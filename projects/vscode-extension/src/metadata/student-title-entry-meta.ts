import {
  Arithmetic,
  arithmaticConfiguraiton,
  Character,
  isArithmetic,
  isCharacter,
  LinscriptInstructionName,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const studentTitleEntryMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StudentTitleEntry,
  hexcode: "0x0F",
  parameters: [
    {
      name: "characterId",
      values: Character,
    },
    {
      name: "operation",
      values: Arithmetic,
    },
    {
      name: "value",
      description: "The value to set, add, or remove from the student title",
    },
  ] as const,
  decorations([character, op, value]) {
    if (!isCharacter(character)) {
      return `Unknown character: ${character}`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    const joiner = op === Arithmetic.Add || op === Arithmetic.Assign ? "to" : "from";

    return [
      {
        contentText: `${arithmaticConfiguraiton[op].name} ${value} ${joiner} `,
      },
      {
        contentText: characterData[character].name,
        color: characterData[character].color,
      },
      { contentText: ` student title entry` },
    ];
  },
};
