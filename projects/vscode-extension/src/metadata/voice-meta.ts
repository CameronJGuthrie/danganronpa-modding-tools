import {
  Character,
  isChapter,
  isCharacter,
  LinscriptInstructionName,
  voiceLinesByCharacterByChapter,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const voiceMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Voice,
  hexcode: "0x08",
  parameters: [
    {
      name: "characterId",
      values: Character,
    },
    {
      name: "chapter",
      description: "chapter (or 99 as N/A)",
    },
    {
      name: "voiceId",
      description: "voiceId (stored as 16 bit number)",
    },
    {
      name: "volume",
      description: "volume is always 100",
    },
  ] as const,
  decorations([character, chapter, voiceId, _volume]) {
    if (!isCharacter(character)) {
      return [{ contentText: `CharacterID ${character}`, color: "gray" }];
    }
    if (!isChapter(chapter)) {
      return "Unknown Chapter";
    }

    const { name, color } = characterData[character];
    const voice = voiceLinesByCharacterByChapter?.[character]?.[chapter]?.[voiceId];

    let text = `${name}: `;

    if (voice) {
      text += `"${voice}"`;
    } else {
      text += `voiceId=${voiceId}`;
    }

    return [{ contentText: text, color }];
  },
};
