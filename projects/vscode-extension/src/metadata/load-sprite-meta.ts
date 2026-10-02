import { LinscriptInstructionName, SpriteSheet, spriteSheetName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadSpriteMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadSprite,
  description:
    "Loads a character's sprite sheet so later Sprite calls can show it; the first and third arguments are not yet understood.",
  parameters: [
    {
      unknown: true,
      description: "objectId ? mapId ?",
    },
    {
      name: "spriteSheet",
      description: "The sprite sheet to load: a student's, or one of the unidentified SpriteSheet_N sheets",
      names: SpriteSheet,
    },
    {
      unknown: true,
      description: "visibility?",
    },
  ] as const,
  decorations([object, sheet, visibility]) {
    return `${object} ${spriteSheetName(sheet) ?? `unknown sheet ${sheet}`} ${visibility}`;
  },
};
