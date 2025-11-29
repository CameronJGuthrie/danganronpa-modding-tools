import { characterData } from "../data/character-data";
import { Arithmetic, arithmaticConfiguraiton, isArithmetic } from "../enum/arithmetic";
import { Character, isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const studentReportInfoMeta: OpcodeMeta = {
  name: OpcodeName.StudentReportInfo,
  opcode: "0x10",
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
      description: "The value to set, add, or remove from the student report",
    },
  ] as const,
  decorations([character, op, value]) {
    if (!isCharacter(character)) {
      return `Unknown character: ${character}`;
    }
    if (!isArithmetic(op)) {
      return `Unknown arithmetic: ${op}`;
    }
    return `${characterData[character].name} report ${arithmaticConfiguraiton[op].name.toLocaleLowerCase()} ${value}`;
  },
};
