import * as path from "node:path";
import { transitionSounds } from "linscript-definitions";
import type * as vscode from "vscode";
import { instructions } from "../../../instructions";
import { getWorkbenchRoot } from "../../workspace";
import { createAudioTestController } from "../test-controller";
import { type AudioTestConfigBuilder, createConfiguration } from "../test-controller-config";

type SoundBLineInfo = {
  soundId: number;
  volume: number;
};

export function registerSoundBTestController(context: vscode.ExtensionContext) {
  const testConfigBuilder: AudioTestConfigBuilder<SoundBLineInfo> = {
    instruction: instructions.SoundB,

    parseInfoFromTest: (test: vscode.TestItem): SoundBLineInfo | null => {
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

    getAudioFilePath: (info: SoundBLineInfo): string | null => {
      const soundInstruction = transitionSounds[info.soundId];
      if (!soundInstruction?.sourcePath) {
        return null;
      }

      // Find the root directory
      const rootDir = getWorkbenchRoot();
      if (!rootDir) {
        return null;
      }

      // Construct the full path
      return path.join(rootDir, "exploration/wad_dr1_data/Dr1/data/all/bgm", soundInstruction.sourcePath);
    },

    formatTestLabel: (info: SoundBLineInfo): string => {
      const soundInstruction = transitionSounds[info.soundId];

      if (soundInstruction?.name && soundInstruction.name !== "?") {
        return `${soundInstruction.name} (${info.soundId})`;
      } else {
        return `SoundB ${info.soundId}`;
      }
    },

    formatDisplayName: (info: SoundBLineInfo): string => {
      const soundName = transitionSounds[info.soundId]?.name;

      if (soundName && soundName !== "?") {
        return `🎵 Playing: "${soundName}" (${info.soundId})`;
      } else {
        return `🎵 Playing Effect #${info.soundId}`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [soundId, volume] = args.map((arg) => arg.value);
      return `${uri}:${line}:${soundId}:${volume}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): SoundBLineInfo | null => {
      const [soundId, volume] = args.map((arg) => arg.value);
      return { soundId, volume };
    },
  };

  createAudioTestController(context, createConfiguration(testConfigBuilder));
}
