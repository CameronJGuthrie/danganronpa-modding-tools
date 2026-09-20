import {
  Chapter,
  isChapter,
  isVoiceCharacter,
  LinscriptInstructionName,
  VoiceCharacter,
  voiceLinesByCharacterByChapter,
} from "linscript-definitions";
import { characterData } from "../data/character-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const voiceMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Voice,
  hexcode: "0x08",
  parameters: [
    {
      name: "character",
      description: "The speaker; only the students, Junko, Genocide Jill and Usami have voice lines",
      names: VoiceCharacter,
    },
    {
      name: "chapter",
      description: "Chapter the line belongs to (Chapter_99 when not tied to one)",
      names: Chapter,
    },
    {
      name: "voiceId",
      description: "voiceId (stored as 16 bit number)",
    },
    {
      name: "volume",
      description: "Volume; every game script uses 100, so source normally omits it",
      defaultValue: 100,
    },
  ] as const,
  decorations([character, chapter, voiceId, _volume]) {
    if (!isVoiceCharacter(character)) {
      return [{ contentText: `Unknown voice character ${character}`, color: "gray" }];
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
