import {
  arithmaticConfiguraiton,
  arithmeticOperators,
  characterData,
  isArithmetic,
  isCharacter,
  LinscriptInstructionName,
  Student,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const studentReportInfoInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.StudentReportInfo,
  description: "Sets, adds to or subtracts from the amount of report-card information unlocked for a student.",
  parameters: [
    {
      name: "character",
      names: Student,
    },
    {
      name: "operation",
      names: arithmeticOperators,
    },
    {
      name: "value",
      description: "The number of report-card entries; the shipped scripts only ever assign it with =",
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
