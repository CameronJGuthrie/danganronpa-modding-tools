import * as path from "path";
import type * as vscode from "vscode";
import { characterData } from "../../../data/character-data";
import { voiceLinesByCharacterByChapter } from "../../../data/voice";
import { isChapter } from "../../../enum/chapter";
import { type Character, isCharacter } from "../../../enum/character";
import { voice } from "../../../metadata/Voice";
import { findRootDirectory } from "../../workspace";
import { createAudioTestController } from "../test-controller";
import { type AudioTestConfigBuilder, createConfiguration } from "../test-controller-config";

type VoiceLineInfo = {
  characterId: number;
  chapter: number;
  voiceId: number;
  volume: number;
};

export function registerVoiceTestController(context: vscode.ExtensionContext) {
  const testConfigBuilder: AudioTestConfigBuilder<VoiceLineInfo> = {
    opcode: voice,
    timeoutMs: 20_000,

    parseInfoFromTest: (test: vscode.TestItem): VoiceLineInfo | null => {
      // Test ID format: "file:///path:line:characterId:chapter:voiceId:volume"
      const parts = test.id.split(":");
      if (parts.length < 4) {
        return null;
      }

      const characterId = parseInt(parts[parts.length - 4], 10);
      const chapter = parseInt(parts[parts.length - 3], 10);
      const voiceId = parseInt(parts[parts.length - 2], 10);
      const volume = parseInt(parts[parts.length - 1], 10);

      if (Number.isNaN(characterId) || Number.isNaN(chapter) || Number.isNaN(voiceId) || Number.isNaN(volume)) {
        return null;
      }

      return { characterId, chapter, voiceId, volume };
    },

    getAudioFilePath: (info: VoiceLineInfo): string | null => {
      // Validate chapter
      if (!isChapter(info.chapter)) {
        return null;
      }

      // Get voice data for this character
      const voiceData = voiceLinesByCharacterByChapter[info.characterId as Character];
      if (!voiceData) {
        return null;
      }

      const chapterData = voiceData[info.chapter];
      if (!chapterData || !chapterData.metadata) {
        return null;
      }

      // Calculate the audio file index
      const baseIndex = chapterData.metadata.index;
      const audioIndex = baseIndex + (info.voiceId - 1);

      // Format as 5-digit zero-padded number
      const indexStr = audioIndex.toString().padStart(5, "0");

      // Find the root directory
      const rootDir = findRootDirectory();
      if (!rootDir) {
        return null;
      }

      // Construct the full path
      return path.join(rootDir, "modded/dr1_data/Dr1/data/us/voice", `dr1_voice_hca_us.awb.${indexStr}.ogg`);
    },

    formatTestLabel: (info: VoiceLineInfo): string => {
      if (isCharacter(info.characterId)) {
        if (isChapter(info.chapter)) {
          const voiceText = voiceLinesByCharacterByChapter[info.characterId]?.[info.chapter]?.[info.voiceId];
          return `${characterData[info.characterId].name}: ${voiceText ?? `(${info.voiceId})`}`;
        } else {
          return `${characterData[info.characterId].name}: (${info.voiceId})`;
        }
      } else {
        return `(${info.characterId}):`;
      }
    },

    formatDisplayName: (info: VoiceLineInfo): string => {
      const voiceText = getVoiceLineText(info.characterId, info.chapter, info.voiceId);
      if (voiceText) {
        return `🎵 Playing: "${voiceText}"`;
      } else {
        return `🎵 Playing Voice: Ch${info.chapter} #${info.voiceId} (Char:${info.characterId})`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [characterId, chapter, voiceId, volume] = args.map((arg) => arg.value);
      return `${uri}:${line}:${characterId}:${chapter}:${voiceId}:${volume}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): VoiceLineInfo | null => {
      const [characterId, chapter, voiceId, volume] = args.map((arg) => arg.value);
      return { characterId, chapter, voiceId, volume };
    },
  };

  createAudioTestController(context, createConfiguration(testConfigBuilder));
}

/**
 * Get the voice line text for display
 */
function getVoiceLineText(characterId: number, chapter: number, voiceId: number): string | null {
  if (!isChapter(chapter)) {
    return null;
  }

  if (!isCharacter(characterId)) {
    return null;
  }

  const voiceData = voiceLinesByCharacterByChapter[characterId];
  if (!voiceData) {
    return null;
  }

  const chapterData = voiceData[chapter];
  if (!chapterData) {
    return null;
  }

  return chapterData[voiceId] || null;
}
