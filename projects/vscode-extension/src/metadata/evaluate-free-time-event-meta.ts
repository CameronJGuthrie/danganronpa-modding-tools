import {
  comparisonOperatorSymbols,
  isCharacter,
  isLogicalCompare,
  LinscriptInstructionName,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const evaluateFreeTimeEventMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.EvaluateFreeTimeEvent,
  hexcode: "0x38",
  parameters: [
    {
      name: "characterId",
    },
    {
      name: "operand",
    },
    {
      name: "value",
    },
  ] as const,
  decorations([characterId, operand, value]) {
    if (!isLogicalCompare(operand)) {
      return `⚠️ Unknown operand ${operand}`;
    }
    const operandSymbol = comparisonOperatorSymbols[operand];

    if (!isCharacter(characterId)) {
      return `⚠️ Unknown character ${operand}`;
    }
    const characterName = characterData[characterId].name;

    return `If ${characterName}'s free time event counter is ${operandSymbol} ${value}`;
  },
};
