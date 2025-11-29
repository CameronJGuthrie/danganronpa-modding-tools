import { characterData } from "../data/character-data";
import { Arithmetic, arithmaticConfiguraiton, isArithmetic } from "../enum/arithmetic";
import { Character, isCharacter } from "../enum/character";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const studentRelationshipMeta: OpcodeMeta = {
  name: OpcodeName.StudentRelationship,
  opcode: "0x11",
  parameters: [
    {
      name: "characterId",
      values: Character,
    },
    {
      name: "operation",
      values: Arithmetic,
    },
    {
      unknown: true,
      description: "Always zero, possibly this combines with amount to form a two byte value",
    },
    {
      name: "amount",
      description: "The value to set, add, or remove from the student relationship",
    },
  ] as const,
  decorations([character, op, _3, amount]) {
    if (!isCharacter(character)) {
      return `Unknown character: ${character}`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    return `${characterData[character].name} relationship ${arithmaticConfiguraiton[op].name.toLocaleLowerCase()} ${amount}`;
  },
};
