import * as vscode from "vscode";
import * as path from "path";
import { createAudioTestController, AudioTestConfig } from "./audio";
import { music } from "../../data/music-data";
import { findRootDirectory } from "../workspace";

type MusicInfo = {
  musicId: number;
  volume: number;
  fadeInTime: number;
}

export function registerMusicTestController(context: vscode.ExtensionContext) {
  const config: AudioTestConfig<MusicInfo> = {
    controllerId: "musicPlayback",
    controllerLabel: "Music Playback",
    runProfileLabel: "Play Music",
    playerName: "Music Player",
    functionPatterns: [
      { name: "Music", paramCount: 3 },
      { name: "0x09", paramCount: 3 }
    ],
    timeoutMs: 15_000,

    parseInfoFromTest: (test: vscode.TestItem): MusicInfo | null => {
      // Test ID format: "file:///path:line:musicId:volume:fadeInTime"
      const parts = test.id.split(":");
      if (parts.length < 3) {
        return null;
      }

      const musicId = parseInt(parts[parts.length - 3]);
      const volume = parseInt(parts[parts.length - 2]);
      const fadeInTime = parseInt(parts[parts.length - 1]);

      if (isNaN(musicId) || isNaN(volume) || isNaN(fadeInTime)) {
        return null;
      }

      return { musicId, volume, fadeInTime };
    },

    getAudioFilePath: (info: MusicInfo): string | null => {
      // Get music data for this ID
      const musicData = music[info.musicId];
      if (!musicData) {
        return null;
      }

      // Find the root directory
      const rootDir = findRootDirectory();
      if (!rootDir) {
        return null;
      }

      // Construct the full path using the base path dr1_data/Dr1/data/all/bgm
      return path.join(
        rootDir,
        'modded/dr1_data/Dr1/data/all/bgm',
        musicData.sourcePath
      );
    },

    formatTestLabel: (info: MusicInfo): string => {
      const musicData = music[info.musicId];
      return musicData?.name ?? `Music ID: ${info.musicId}`;
    },

    formatDisplayName: (info: MusicInfo): string => {
      const musicName = music[info.musicId]?.name;
      if (musicName) {
        return `🎵 Playing: ${musicName}`;
      } else {
        return `🎵 Playing music ID: ${info.musicId}`;
      }
    },

    createTestId: (uri: string, line: number, args: Array<{ value: number }>): string => {
      const [musicId, volume, fadeInTime] = args.map(arg => arg.value);
      return `${uri}:${line}:${musicId}:${volume}:${fadeInTime}`;
    },

    parseInfoFromArgs: (args: Array<{ value: number }>): MusicInfo | null => {
      const [musicId, volume, fadeInTime] = args.map(arg => arg.value);
      return { musicId, volume, fadeInTime };
    }
  };

  createAudioTestController(context, config);
}
