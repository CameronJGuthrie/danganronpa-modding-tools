import { characterData } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { comparisonOperatorSymbols, isLogicalCompare } from "../enum/logical-compare";
import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const evaluateFreeTimeEventMeta: OpcodeMeta = {
  name: OpcodeName.EvaluateFreeTimeEvent,
  opcode: "0x38",
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
