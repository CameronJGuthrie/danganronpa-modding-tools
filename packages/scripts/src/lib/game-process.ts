/**
 * Finding and stopping the running game. Under Proton the game is a Wine process whose command
 * line names the executable, `DR1_us.exe` (or `Launcher.exe` for its own launcher window),
 * inside the game directory, so that is what the processes are matched on.
 */

import { execFile } from "node:child_process";
import { basename } from "node:path";
import { promisify } from "node:util";
import { setTimeout as sleep } from "node:timers/promises";
import { getGameDirectoryOrThrow } from "./steam-paths.ts";

const execFileAsync = promisify(execFile);

/** How long to wait for the game's processes to exit after being signalled. */
const STOP_TIMEOUT_MS = 10_000;

/** A regex (for `pgrep -f`) matching the game's executables inside the game directory. */
function gameProcessPattern(): string {
  const dir = basename(getGameDirectoryOrThrow()).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `${dir}.*(DR1_us|Launcher)\\.exe`;
}

/** Pids of the game's running processes; empty when it is not running. */
export async function findGameProcesses(): Promise<number[]> {
  try {
    const { stdout } = await execFileAsync("pgrep", ["-f", gameProcessPattern()]);
    return stdout.split("\n").filter((line) => line !== "").map(Number);
  } catch (error) {
    // pgrep exits 1 when nothing matches
    if (typeof error === "object" && error !== null && "code" in error && error.code === 1) {
      return [];
    }
    throw error;
  }
}

/**
 * Terminate the game if it is running and wait for it to exit, escalating to SIGKILL when it
 * ignores SIGTERM. Returns the pids that were stopped (none when it was not running).
 */
export async function stopGame(): Promise<number[]> {
  const pids = await findGameProcesses();
  if (pids.length === 0) {
    return [];
  }
  signal(pids, "SIGTERM");
  const deadline = Date.now() + STOP_TIMEOUT_MS;
  while ((await findGameProcesses()).length > 0) {
    if (Date.now() > deadline) {
      signal(await findGameProcesses(), "SIGKILL");
      await sleep(500);
      break;
    }
    await sleep(250);
  }
  return pids;
}

function signal(pids: number[], sig: NodeJS.Signals): void {
  for (const pid of pids) {
    try {
      process.kill(pid, sig);
    } catch {
      // already gone
    }
  }
}
