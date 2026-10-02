import {
  arithmaticConfiguraiton,
  arithmeticOperators,
  isArithmetic,
  isStudent,
  LinscriptInstructionName,
  Student,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const studentRelationshipMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StudentRelationship,
  hexcode: "0x11",
  description: "Sets, adds to or subtracts from the player's relationship value with a student.",
  parameters: [
    {
      name: "student",
      description: "The student whose relationship value changes; only ids 0-15 have a report card",
      names: Student,
    },
    {
      name: "operation",
      names: arithmeticOperators,
    },
    {
      name: "amount",
      description: "The two-byte value to set, add, or remove from the student relationship",
    },
  ] as const,
  decorations([student, op, amount]) {
    if (!isStudent(student)) {
      return `Unknown student: ${student} (valid ids are 0-15)`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    return `${characterData[student].name} relationship ${arithmaticConfiguraiton[op].name.toLocaleLowerCase()} ${amount}`;
  },
};
