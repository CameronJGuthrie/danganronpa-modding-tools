import { OpcodeName, OpcodeMeta } from "../enum/opcode";
import { comparisonOperatorSymbols, isLogicalCompare, isLogicalJoin, joins } from "../enum/logical";
import { isVariable, variables } from "../enum/variable";

export const evaluate: OpcodeMeta = {
  name: OpcodeName.Evaluate,
  opcode: "0x36",
  varargs: true,
  parameters: [],
  decorations: (args) => {
    // Format: 3 args (first expression) + n * 4 args (additional expressions)
    const matchesExpectedLength = args.length >= 3 && (args.length - 3) % 4 === 0;

    if (!matchesExpectedLength) {
      return `⚠️ Invalid args length (expected 3 + n*4, got ${args.length})`;
    }

    let description = "If ";

    for (let i = 0; i < args.length;) {
      // First iteration: 3 args (variable, operand, value)
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

      const variable = args[i];
      const operand = args[i + 1];
      const value = args[i + 2];

      if (!isLogicalCompare(operand)) {
        return `⚠️ Unknown operand ${operand}`;
      }

      const variableDescription = isVariable(variable) ? variables[variable] : `variable ${variable}`;
      description += `${variableDescription} ${comparisonOperatorSymbols[operand]} ${value}`;

      i += 3;
    }

    return description;
  }
};
