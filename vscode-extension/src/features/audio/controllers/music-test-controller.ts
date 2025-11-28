import * as path from "node:path";
import type * as vscode from "vscode";
import { musics } from "../../../data/music-data";
import { music } from "../../../metadata/Music";
import { findRootDirectory } from "../../workspace";
import { createAudioTestController } from "../test-controller";
import { type AudioTestConfigBuilder, createConfiguration } from "../test-controller-config";

type MusicInfo = {
  musicId: number;
  volume: number;
  fadeInTime: number;
};

export function registerMusicTestController(context: vscode.ExtensionContext) {
  const testConfigBuilder: AudioTestConfigBuilder<MusicInfo> = {
    opcode: music,
    timeoutMs: 15_000,

    parseInfoFromTest: (test: vscode.TestItem): MusicInfo | null => {
      // Test ID format: "file:///path:line:musicId:volume:fadeInTime"
      const parts = test.id.split(":");
      if (parts.length < 3) {
        return null;
      }

      const musicId = parseInt(parts[parts.length - 3], 10);
      const volume = parseInt(parts[parts.length - 2], 10);
      const fadeInTime = parseInt(parts[parts.length - 1], 10);

      if (Number.isNaN(musicId) || Number.isNaN(volume) || Number.isNaN(fadeInTime)) {
        return null;
      }

      return { musicId, volume, fadeInTime };
    },

    getAudioFilePath: (info: MusicInfo): string | null => {
      // Get music data for this ID
      const musicData = musics[info.musicId];
      if (!musicData) {
        return null;
      }

      // Find the root directory
      const rootDir = findRootDirectory();
      if (!rootDir) {
        return null;
      }

      // Construct the full path using the base path dr1_data/Dr1/data/all/bgm
      return path.join(rootDir, "modded/dr1_data/Dr1/data/all/bgm", musicData.sourcePath);
    },

    formatTestLabel: (info: MusicInfo): string => {
      const musicData = musics[info.musicId];
      return musicData?.name ?? `Music ID: ${info.musicId}`;
    },

    formatDisplayName: (info: MusicInfo): string => {
      const musicName = musics[info.musicId]?.name;
      if (musicName) {
        return `🎵 Playing: ${musicName}`;
      } else {
        return `🎵 Playing music ID: ${info.musicId}`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [musicId, volume, fadeInTime] = args.map((arg) => arg.value);
      return `${uri}:${line}:${musicId}:${volume}:${fadeInTime}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): MusicInfo | null => {
      const [musicId, volume, fadeInTime] = args.map((arg) => arg.value);
      return { musicId, volume, fadeInTime };
    },
  };

  createAudioTestController(context, createConfiguration(testConfigBuilder));
}
