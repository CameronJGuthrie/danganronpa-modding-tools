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

export const studentReportInfoMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StudentReportInfo,
  hexcode: "0x10",
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
      description: "The value to set, add, or remove from the student report",
    },
  ] as const,
  decorations([character, op, value]) {
    if (!isCharacter(character)) {
      return `Unknown character: ${character}`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    return `${characterData[character].name} report ${arithmaticConfiguraiton[op].name.toLocaleLowerCase()} ${value}`;
  },
};
