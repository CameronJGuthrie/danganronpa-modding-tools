import * as vscode from "vscode";
import * as path from "path";
import { createAudioTestController, AudioTestConfig } from "./audio";
import { transitionSounds } from "../../data/sound-data";
import { findRootDirectory } from "../workspace";

type SoundBLineInfo = {
  soundId: number;
  volume: number;
}

export function registerSoundBTestController(context: vscode.ExtensionContext) {
  const config: AudioTestConfig<SoundBLineInfo> = {
    controllerId: "soundBPlayback",
    controllerLabel: "SoundB Playback",
    runProfileLabel: "Play SoundB",
    playerName: "SoundB Player",
    functionPatterns: [
      { name: "SoundB", paramCount: 2 },
      { name: "0x0B", paramCount: 2 }
    ],
    timeoutMs: 20_000,

    parseInfoFromTest: (test: vscode.TestItem): SoundBLineInfo | null => {
      // Test ID format: "file:///path:line:soundId:volume"
      const parts = test.id.split(":");
      if (parts.length < 2) {
        return null;
      }

      const soundId = parseInt(parts[parts.length - 2]);
      const volume = parseInt(parts[parts.length - 1]);

      if (isNaN(soundId) || isNaN(volume)) {
        return null;
      }

      return { soundId, volume };
    },

    getAudioFilePath: (info: SoundBLineInfo): string | null => {
      const soundMeta = transitionSounds[info.soundId];
      if (!soundMeta || !soundMeta.sourcePath) {
        return null;
      }

      // Find the root directory
      const rootDir = findRootDirectory();
      if (!rootDir) {
        return null;
      }

      // Construct the full path
      return path.join(
        rootDir,
        'modded/dr1_data/Dr1/data/all/bgm',
        soundMeta.sourcePath
      );
    },

    formatTestLabel: (info: SoundBLineInfo): string => {
      const soundMeta = transitionSounds[info.soundId];

      if (soundMeta && soundMeta.name && soundMeta.name !== "?") {
        return `${soundMeta.name} (${info.soundId})`;
      } else {
        return `SoundB ${info.soundId}`;
      }
    },

    formatDisplayName: (info: SoundBLineInfo): string => {
      const soundName = transitionSounds[info.soundId]?.name;

      if (soundName && soundName !== "?") {
        return `🎵 Playing BGM: "${soundName}" (${info.soundId})`;
      } else {
        return `🎵 Playing BGM #${info.soundId}`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [soundId, volume] = args.map(arg => arg.value);
      return `${uri}:${line}:${soundId}:${volume}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): SoundBLineInfo | null => {
      const [soundId, volume] = args.map(arg => arg.value);
      return { soundId, volume };
    }
  };

  createAudioTestController(context, config);
}
