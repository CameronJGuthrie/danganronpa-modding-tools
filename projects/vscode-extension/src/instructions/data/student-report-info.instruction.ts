import {
  arithmaticConfiguraiton,
  arithmeticOperators,
  Character,
  characterData,
  isArithmetic,
  isCharacter,
  LinscriptInstructionName,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const studentReportInfoInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.StudentReportInfo,
  description: "Sets, adds to or subtracts from the amount of report-card information unlocked for a student.",
  parameters: [
    {
      name: "characterId",
      values: Character,
    },
    {
      name: "operation",
      names: arithmeticOperators,
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
