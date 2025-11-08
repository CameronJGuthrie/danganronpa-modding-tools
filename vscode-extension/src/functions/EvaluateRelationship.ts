import { characterConfiguration } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { FunctionName, LinscriptFunction } from "../enum/function";
import { comparisonOperatorSymbols, isLogicalCompare } from "../enum/logical";

export const evaluateRelationship: LinscriptFunction = {
  name: FunctionName.EvaluateRelationship,
  opcode: "0x39",
  parameters: [
    {
      name: "characterId"
    },
    {
      name: "operand" // this is always 4 or 5
    },
    {
      name: "value" // this is either 0 or 20
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

    return `If ${characterName}'s relationship is ${operandSymbol} ${value}`;
  },
};
