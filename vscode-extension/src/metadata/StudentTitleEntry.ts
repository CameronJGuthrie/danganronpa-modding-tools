import { characterData } from "../data/character-data";
import { Arithmetic, arithmaticConfiguraiton, isArithmetic } from "../enum/arithmetic";
import { Character, isCharacter } from "../enum/character";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const studentTitleEntry: OpcodeMeta = {
  name: OpcodeName.StudentTitleEntry,
  opcode: "0x0F",
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
    const joiner = op === Arithmetic.Add || op === Arithmetic.Assign ? "to" : "from";

    return [
      {
        contentText: `${arithmaticConfiguraiton[op].name} ${value} ${joiner} `,
      },
      {
        contentText: characterData[character].name,
        color: characterData[character].color,
      },
      { contentText: ` student title entry` },
    ];
  },
};
