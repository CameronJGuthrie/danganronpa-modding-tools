import * as path from "path";
import type * as vscode from "vscode";
import { sounds } from "../../../data/sound-data";
import { sound } from "../../../metadata/Sound";
import { findRootDirectory } from "../../workspace";
import { createAudioTestController } from "../test-controller";
import { type AudioTestConfigBuilder, createConfiguration } from "../test-controller-config";

type SoundLineInfo = {
  soundId: number;
  volume: number;
};

export function registerSoundTestController(context: vscode.ExtensionContext) {
  const testConfigBuilder: AudioTestConfigBuilder<SoundLineInfo> = {
    opcode: sound,
    timeoutMs: 10_000,

    parseInfoFromTest: (test: vscode.TestItem): SoundLineInfo | null => {
      // Test ID format: "file:///path:line:soundId:volume"
      const parts = test.id.split(":");
      if (parts.length < 2) {
        return null;
      }

      const soundId = parseInt(parts[parts.length - 2], 10);
      const volume = parseInt(parts[parts.length - 1], 10);

      if (Number.isNaN(soundId) || Number.isNaN(volume)) {
        return null;
      }

      return { soundId, volume };
    },

    getAudioFilePath: (info: SoundLineInfo): string | null => {
      const soundMeta = sounds[info.soundId];
      if (!soundMeta || !soundMeta.sourcePath) {
        return null;
      }

      // Find the root directory
      const rootDir = findRootDirectory();
      if (!rootDir) {
        return null;
      }

      // Construct the full path
      return path.join(rootDir, "modded/dr1_data/Dr1/data/all/se", soundMeta.sourcePath);
    },

    formatTestLabel: (info: SoundLineInfo): string => {
      const soundMeta = sounds[info.soundId];

      if (soundMeta && soundMeta.name && soundMeta.name !== "?") {
        return `${soundMeta.name} (${info.soundId})`;
      } else {
        return `Sound ${info.soundId}`;
      }
    },

    formatDisplayName: (info: SoundLineInfo): string => {
      const soundName = sounds[info.soundId]?.name;

      if (soundName && soundName !== "?") {
        return `🔊 Playing: "${soundName}" (${info.soundId})`;
      } else {
        return `🔊 Playing Effect #${info.soundId}`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [soundId, volume] = args.map((arg) => arg.value);
      return `${uri}:${line}:${soundId}:${volume}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): SoundLineInfo | null => {
      const [soundId, volume] = args.map((arg) => arg.value);
      return { soundId, volume };
    },
  };

  createAudioTestController(context, createConfiguration(testConfigBuilder));
}
