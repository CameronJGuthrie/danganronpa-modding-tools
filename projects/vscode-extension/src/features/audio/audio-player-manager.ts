import type { ChildProcess } from "node:child_process";
import type * as vscode from "vscode";
import { log, logError } from "../../output";
import { spawnAudio } from "./play-audio";

/**
 * A playback lane. Only one process plays per channel at a time; starting a new
 * one on a channel stops whatever that channel was already playing.
 */
export type AudioChannel = string;

/** Starts a player process for a file. Injectable so the manager can be tested without real audio. */
export type SpawnAudio = (audioPath: string) => ChildProcess;

/**
 * Tracks the live player process for each channel so playback can be replaced
 * or stopped instead of overlapping.
 */
export class AudioPlayerManager implements vscode.Disposable {
  private readonly playing = new Map<AudioChannel, ChildProcess>();

  constructor(private readonly spawnPlayer: SpawnAudio = spawnAudio) {}

  /** Stop whatever is playing on `channel`, then start `audioPath` there. */
  play(channel: AudioChannel, audioPath: string): ChildProcess {
    this.stop(channel);

    const child = this.spawnPlayer(audioPath);
    this.playing.set(channel, child);
    log(`[${channel}] started pid ${child.pid ?? "?"}: ${audioPath}`);

    child.once("error", (error) => {
      logError(`[${channel}] player failed: ${error.message}`);
      this.forget(channel, child);
    });

    child.once("exit", (code, signal) => {
      log(`[${channel}] pid ${child.pid ?? "?"} exited (${signal ?? code})`);
      this.forget(channel, child);
    });

    return child;
  }

  /** Stop playback on `channel` if anything is playing. Returns true when a process was killed. */
  stop(channel: AudioChannel): boolean {
    const child = this.playing.get(channel);
    if (!child) {
      return false;
    }

    this.playing.delete(channel);
    log(`[${channel}] stopping pid ${child.pid ?? "?"}`);
    child.kill();
    return true;
  }

  /** True when `channel` currently has a live process. */
  isPlaying(channel: AudioChannel): boolean {
    return this.playing.has(channel);
  }

  /** Stop every channel. */
  stopAll(): void {
    for (const channel of [...this.playing.keys()]) {
      this.stop(channel);
    }
  }

  dispose(): void {
    this.stopAll();
  }

  /** Drop the entry for `channel` only if it still refers to `child`; a newer process may have replaced it. */
  private forget(channel: AudioChannel, child: ChildProcess): void {
    if (this.playing.get(channel) === child) {
      this.playing.delete(channel);
    }
  }
}

let sharedManager: AudioPlayerManager | undefined;

/** The single manager shared by every audio controller, created on first use and disposed with the extension. */
export function getAudioPlayerManager(context: vscode.ExtensionContext): AudioPlayerManager {
  if (!sharedManager) {
    sharedManager = new AudioPlayerManager();
    context.subscriptions.push({
      dispose: () => {
        sharedManager?.dispose();
        sharedManager = undefined;
      },
    });
  }
  return sharedManager;
}
