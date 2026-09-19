import { LinscriptInstructionName, SpriteSheet, spriteSheetName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadSpriteMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadSprite,
  hexcode: "0x01",
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
