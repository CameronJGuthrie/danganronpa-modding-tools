import {
  characterData,
  comparisonOperatorSymbols,
  comparisonOperators,
  isLogicalCompare,
  isStudent,
  LinscriptInstructionName,
  Student,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const ifRelationshipInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.IfRelationship,
  description:
    "Branches on the player's relationship level with a character (the scripts only compare against 0 or 20). The last argument is the jump taken when it holds, Goto(label).",
  branch: true,
  parameters: [
    {
      name: "student",
      description:
        "The student whose relationship level is tested; written by name, e.g. IfRelationship(Sayaka, <, 20)",
      names: Student,
    },
    {
      name: "operand", // this is always 4 or 5
      names: comparisonOperators,
    },
    {
      name: "value", // this is either 0 or 20
    },
  ] as const,
  decorations([student, operand, value]) {
    if (!isLogicalCompare(operand)) {
      return `⚠️ Unknown operand ${operand}`;
    }
    const operandSymbol = comparisonOperatorSymbols[operand];

    if (!isStudent(student)) {
      return `⚠️ Unknown student ${student} (valid ids are 0-15)`;
    }
    const characterName = characterData[student].name;

    return `If ${characterName}'s relationship is ${operandSymbol} ${value}`;
  },
};
