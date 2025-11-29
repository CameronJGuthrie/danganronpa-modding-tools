import { characterData } from "../data/character-data";

import { sprites } from "../data/sprite";
import { Character, isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const spriteMeta: OpcodeMeta = {
  name: OpcodeName.Sprite,
  hexcode: "0x1E",
  parameters: [
    {
      name: "objectId",
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
        0: "", // 0 rendered nothing
        1: "", // 1 rendered a bustup with a quick fade in
        2: "", // 2 rendered a bustup with a slow fade in
        3: "", // 3 rendered nothing
        4: "", // 4 rendered nothing
        5: "", // 5 rendered nothing
        6: "", // 6 sprite slides in from bottom
        7: "", // 7 rendered nothing
        8: "", // 8 immediately appeared with no fade
        9: "", // 9 positions the sprite lower and on the left
        10: "", // 10 rendered nothing
      },
      unknown: true,
    },
    {
      name: "position",
      values: {
        0: "Leftmost",
        1: "Left",
        2: "Center",
        3: "Right",
        4: "Rightmost",
      },
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
