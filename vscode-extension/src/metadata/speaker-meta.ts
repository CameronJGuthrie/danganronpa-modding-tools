import { characterData } from "../data/character-data";
import { isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const speakerMeta: OpcodeMeta = {
  name: OpcodeName.Speaker,
  opcode: "0x21",
  parameters: [
    {
      name: "characterId",
    },
  ] as const,
  decorations([character]) {
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown Speaker ID ${character}`, color: "gray" }];
    }
    const { name, color } = characterData[character];

    return [{ contentText: `Speaker: ${name}`, color }];
  },
};
