import {
  comparisonOperatorSymbols,
  comparisonOperators,
  isLogicalCompare,
  isStudent,
  LinscriptInstructionName,
  Student,
  characterData,
} from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const ifFreeTimeEventMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.IfFreeTimeEvent,
  description:
    "Branches on how many free-time events the player has seen with a character. The last argument is the jump taken when it holds, Goto(label).",
  branch: true,
  parameters: [
    {
      name: "student",
      description: "The student whose free-time event count is tested; only ids 0-15 have a report card",
      names: Student,
    },
    {
      name: "operand",
      names: comparisonOperators,
    },
    {
      name: "value",
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

    return `If ${characterName}'s free time event counter is ${operandSymbol} ${value}`;
  },
};
