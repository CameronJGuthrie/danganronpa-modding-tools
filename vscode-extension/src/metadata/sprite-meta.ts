import { characterData } from "../data/character-data";

import { sprites } from "../data/sprite";
import { Character, isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const spriteMeta: OpcodeMeta = {
  name: OpcodeName.Sprite,
  opcode: "0x1E",
  parameters: [
    {
      name: "objectId",
      description: "0x27(this-param) seems to be a handler for interactions",
    },
    {
      name: "characterId",
      values: Character,
    },
    {
      name: "spriteId",
      unknown: true,
    },
    {
      name: "state",
      values: {
        0: "non-interactable",
        1: "interactable",
      },
      unknown: true,
      description: "This only seems to have an effect when the character is in a room.",
    },
    {
      name: "type",
      unknown: true,
    },
  ] as const,
  decorations([_, character, spriteId, _p4, _p5]) {
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown character`, color: "gray" }];
    }

    const { name, color } = characterData[character];

    const expression = sprites?.[character]?.[spriteId] ?? "Unknown Sprite";

    return [{ contentText: `${name}: «${expression}»`, color }];
  },
};

export default spriteMeta;
