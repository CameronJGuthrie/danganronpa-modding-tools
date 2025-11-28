import { characterConfiguration } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { OpcodeName, OpcodeMeta } from "../enum/opcode";
import { comparisonOperatorSymbols, isLogicalCompare } from "../enum/logical";

export const evaluateFreeTimeEvent: OpcodeMeta = {
  name: OpcodeName.EvaluateFreeTimeEvent,
  opcode: "0x38",
  parameters: [
    {
      name: "characterId"
    },
    {
      name: "operand"
    },
    {
      name: "value"
    }
  ] as const,
  decorations([characterId, operand, value]) {
    if (!isLogicalCompare(operand)) {
      return `⚠️ Unknown operand ${operand}`;
    }
    const operandSymbol = comparisonOperatorSymbols[operand];

    if (!isCharacter(characterId)) {
      return `⚠️ Unknown character ${operand}`;
    }
    const characterName = characterConfiguration[characterId].name;

    return `If ${characterName}'s free time event counter is ${operandSymbol} ${value}`;
  },
};
