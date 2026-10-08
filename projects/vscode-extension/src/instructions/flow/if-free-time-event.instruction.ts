import {
  characterData,
  comparisonOperatorSymbols,
  comparisonOperators,
  isLogicalCompare,
  isLogicalJoin,
  isStudent,
  joins,
  LinscriptInstructionName,
  LogicalJoin,
  Student,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const ifFreeTimeEventInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.IfFreeTimeEvent,
  description:
    "Branches on how many free-time events the player has seen with a character: each condition is student, comparison, value, with And/Or joins between conditions. The last argument is the jump taken when it holds, Goto(label).",
  branch: true,
  varargs: true,
  varargNames: {
    head: [Student, comparisonOperators, undefined],
    tail: [LogicalJoin, Student, comparisonOperators, undefined],
  },
  parameters: [],
  decorations: (args) => {
    // Format: 3 args (first expression) + n * 4 args (additional expressions)
    const matchesExpectedLength = args.length >= 3 && (args.length - 3) % 4 === 0;

    if (!matchesExpectedLength) {
      return `⚠️ Invalid args length (expected 3 + n*4, got ${args.length})`;
    }

    let description = "If ";

    for (let i = 0; i < args.length; ) {
      // First iteration: 3 args (student, operand, value)
      // Subsequent iterations: skip joiner + 3 args
      const isFirstExpression = i === 0;

      if (!isFirstExpression) {
        const joiner = args[i];
        if (!isLogicalJoin(joiner)) {
          return `⚠️ Unknown joiner ${joiner}`;
        }
        description += ` ${joins[joiner]} `;
        i += 1;
      }

      const student = args[i];
      const operand = args[i + 1];
      const value = args[i + 2];

      if (!isLogicalCompare(operand)) {
        return `⚠️ Unknown operand ${operand}`;
      }

      if (!isStudent(student)) {
        return `⚠️ Unknown student ${student} (valid ids are 0-15)`;
      }

      description += `${characterData[student].name}'s free time event counter is ${comparisonOperatorSymbols[operand]} ${value}`;

      i += 3;
    }

    return description;
  },
};
