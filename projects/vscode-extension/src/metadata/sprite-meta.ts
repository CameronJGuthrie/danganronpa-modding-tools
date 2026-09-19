import { CharacterSprite, isCharacterSprite, LinscriptInstructionName } from "linscript-definitions";
import { characterData } from "../data/character-data";
import { sprites } from "../data/sprite";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const spriteMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Sprite,
  hexcode: "0x1E",
  parameters: [
    {
      name: "objectId",
    },
    {
      name: "character",
      description: "The character whose sprite is shown; only the students, Junko, Alter Ego and Usami have sprites",
      names: CharacterSprite,
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
  decorations([_, character, spriteId, animation, position]) {
    if (!isCharacterSprite(character)) {
      return [{ contentText: `Unknown sprite character ${character}`, color: "gray" }];
    }

    const { name, color } = characterData[character];

    const expression = sprites?.[character]?.[spriteId] ?? "Unknown Sprite";
    const animationName = animations[animation] ? ` (${animations[animation]})` : "";
    const positionName = positions[position] ? ` ${positions[position]}` : "";

    return [{ contentText: `${name}: «${expression}» ${animationName}${positionName}`, color }];
  },
};

const animations: { [key: number]: string } = {
  1: "fade in", // 1 rendered a bustup with a quick fade in
  2: "slow fade in", // 2 rendered a bustup with a slow fade in
  6: "slide in from bottom", // 6 sprite slides in from bottom
  8: "immediate", // 8 immediately appeared with no fade
  9: "offset left", // 9 positions the sprite lower and on the left
};

const positions: { [key: number]: string } = {
  0: "Leftmost",
  1: "Left",
  2: "Center",
  3: "Right",
  4: "Rightmost",
};
