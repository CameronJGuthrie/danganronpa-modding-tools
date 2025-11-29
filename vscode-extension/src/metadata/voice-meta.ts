import { characterData } from "../data/character-data";
import { voiceLinesByCharacterByChapter } from "../data/voice";
import { isChapter } from "../enum/chapter";
import { Character, isCharacter } from "../enum/character";
import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const voiceMeta: OpcodeMeta = {
  name: OpcodeName.Voice,
  opcode: "0x08",
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
