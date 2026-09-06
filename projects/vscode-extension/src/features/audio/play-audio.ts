import type { ChildProcess } from "node:child_process";
import { spawn, spawnSync } from "node:child_process";
import { log } from "../../output";

/**
 * A command-line audio player the extension knows how to drive.
 * Each entry builds the argument list that plays one file to completion and then exits.
 */
type Player = {
  command: string;
  args: (audioPath: string) => string[];
};

/**
 * Candidate players in order of preference.
 *
 * - ffplay: comes with ffmpeg. https://ffmpeg.org/ffplay.html
 * - mpv: popular media player. https://mpv.io/
 * - paplay: PulseAudio player, common on Linux. https://linux.die.net/man/1/paplay
 */
const PLAYERS: Player[] = [
  { command: "ffplay", args: (audioPath) => ["-nodisp", "-autoexit", "-volume", "50", audioPath] },
  { command: "mpv", args: (audioPath) => ["--really-quiet", audioPath] },
  { command: "paplay", args: (audioPath) => [audioPath] },
];

let resolvedPlayer: Player | null | undefined;

/** True when `command` can be launched from this environment. */
function isAvailable(command: string): boolean {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { stdio: "ignore" });
  return result.status === 0;
}

/**
 * Pick the first installed player. The result is cached for the life of the extension host.
 * Returns null when none of the candidates is installed.
 */
export function resolvePlayer(): Player | null {
  if (resolvedPlayer === undefined) {
    resolvedPlayer = PLAYERS.find((player) => isAvailable(player.command)) ?? null;
    log(resolvedPlayer ? `Audio player: ${resolvedPlayer.command}` : "No supported audio player found");
  }
  return resolvedPlayer;
}

/**
 * Start playing an audio file and return the running process so the caller can stop it.
 * Throws when no supported player is installed.
 */
export function spawnAudio(audioPath: string): ChildProcess {
  const player = resolvePlayer();
  if (!player) {
    throw new Error(`No audio player found. Install one of: ${PLAYERS.map((p) => p.command).join(", ")}`);
  }

  return spawn(player.command, player.args(audioPath), { stdio: "ignore" });
}
