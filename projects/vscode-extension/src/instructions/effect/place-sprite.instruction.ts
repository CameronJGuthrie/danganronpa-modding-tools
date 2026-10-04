import {
  CharacterSprite,
  characterData,
  isCharacterSprite,
  LinscriptInstructionName,
  spriteNamesByCharacter,
  sprites,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Source-only sugar for `Sprite(slot, character, expression, 0, 0)`: sets a slot's sprite without
 * showing a bust-up, which is how scripts place courtroom stands and the characters a free-roam
 * scene lets the player talk to.
 */
export const placeSpriteInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.PlaceSprite,
  sugar: true,
  description:
    "Places a character in a slot without showing a bust-up; sugar for Sprite(slot, character, expression, 0, 0). The slot is what Character(id, Name) in Meta() and OnCharacter refer to.",
  parameters: [
    {
      name: "objectId",
    },
    {
      name: "character",
      description: "The character placed; only the students, Junko, Alter Ego and Usami have sprites",
      names: CharacterSprite,
    },
    {
      name: "expression",
      description: "The sprite shown if the object is later revealed; Invisible (98) is a transparent sprite",
      namesBy: { argument: -1, tables: spriteNamesByCharacter },
    },
  ] as const,
  decorations([_, character, spriteId]) {
    if (!isCharacterSprite(character)) {
      return [{ contentText: `Unknown sprite character ${character}`, color: "gray" }];
    }
    const { name, color } = characterData[character];
    const expression = sprites?.[character]?.[spriteId] ?? "Unknown Sprite";
    return [{ contentText: `${name}: «${expression}» (placed)`, color }];
  },
};
