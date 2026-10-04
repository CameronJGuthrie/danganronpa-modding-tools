import {
  Bool,
  comparisonOperatorSymbols,
  comparisonOperators,
  FlagGroup,
  flagDataByFlagGroup,
  flagNamesByFlagGroup,
  flagGroups,
  isFlagGroup,
  isLogicalCompare,
  isLogicalJoin,
  joins,
  LinscriptInstructionName,
  LogicalJoin,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";
import type { DependentNames } from "../../util/string-util";

/**
 * The offset's names depend on the flag group: known flag names, plus character and skill ids for
 * those groups, and the document's `SceneFlag(id, Name)` entries for the SceneFlags group.
 */
const flagOffset: DependentNames = {
  argument: -1,
  tables: flagNamesByFlagGroup,
  scopes: { [FlagGroup.SceneFlags]: "SceneFlag" },
};

export const ifFlagInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.IfFlag,
  description:
    "Branches on one or more flags: each condition is flagGroup, offset, comparison, value, with And/Or joins between conditions. The last argument is the jump taken when it holds, Goto(label).",
  branch: true,
  varargs: true,
  varargNames: {
    head: [FlagGroup, flagOffset, comparisonOperators, Bool],
    tail: [LogicalJoin, FlagGroup, flagOffset, comparisonOperators, Bool],
  },
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
