import { flagDataByFlagGroup } from "../data/flag-data";
import { flagGroups, isFlagGroup } from "../enum/flag-group";
import { comparisonOperatorSymbols, isLogicalCompare } from "../enum/logical-compare";
import { joins } from "../enum/logical-join";
import { isLogicalJoin } from "../enum/logical-join";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const evaluateFlagMeta: OpcodeMeta = {
  name: OpcodeName.EvaluateFlag,
  opcode: "0x35",
  varargs: true,
  parameters: [],
  decorations: (args) => {
    // Format: 4 args (first expression) + n * 5 args (additional expressions)
    const matchesExpectedLength = args.length >= 4 && (args.length - 4) % 5 === 0;

    if (!matchesExpectedLength) {
      return `⚠️ Invalid args length (expected 4 + n*5, got ${args.length})`;
    }

    let description = "If ";

    for (let i = 0; i < args.length; ) {
      // First iteration: 4 args (flagGroup, flagName, operand, value)
      // Subsequent iterations: skip joiner + 4 args
      const isFirstExpression = i === 0;

      if (!isFirstExpression) {
        const joiner = args[i];
        if (!isLogicalJoin(joiner)) {
          return `⚠️ Unknown joiner ${joiner}`;
        }
        description += ` ${joins[joiner]} `;
        i += 1;
      }

      const flagGroup = args[i];
      const flagName = args[i + 1];
      const operand = args[i + 2];
      const value = args[i + 3];

      if (!isLogicalCompare(operand)) {
        return `⚠️ Unknown operand ${operand}`;
      }

      if (!isFlagGroup(flagGroup)) {
        return `⚠️ Unknown group ${flagGroup}`;
      }

      const flagGroupDesc = flagDataByFlagGroup[flagGroup]?.[flagName]?.name ?? `[${flagName}]`;
      description += `${flagGroups[flagGroup]} ${flagGroupDesc} ${comparisonOperatorSymbols[operand]} ${value}`;

      i += 4;
    }

    return description;
  },
};
