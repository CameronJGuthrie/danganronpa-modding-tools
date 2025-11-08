import { arithmaticConfiguraiton, Arithmetic, isArithmetic } from "../enum/arithmetic";
import { Character, isCharacter } from "../enum/character";
import { characterConfiguration } from "../data/character-data";
import { FunctionName, LinscriptFunction } from "../enum/function";

export const studentTitleEntry: LinscriptFunction = {
  name: FunctionName.StudentTitleEntry,
  opcode: "0x0F",
  parameters: [
    {
      name: "characterId",
      values: Character
    },
    {
      name: "operation",
      values: Arithmetic
    },
    {
      name: "value",
      description: "The value to set, add, or remove from the student title",
    },
  ] as const,
  decorations([character, op, value]) {
    if (!isCharacter(character)) {
      return `Unknown character: ${character}`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    const joiner = (op === Arithmetic.Add || op === Arithmetic.Assign)
      ? "to"
      : "from";

    return [
      { contentText: `${arithmaticConfiguraiton[op].name} ${value} ${joiner} ` },
      { contentText: characterConfiguration[character].name, color: characterConfiguration[character].color },
      { contentText: ` student title entry` },
    ]
  },
}
