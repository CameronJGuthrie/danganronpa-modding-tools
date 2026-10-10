#!/usr/bin/env node

/**
 * Stops the game if it is running, so a build can replace its WADs and a launch starts fresh.
 *
 *   pnpm run stop
 */

import { errorMessage } from "../lib/errors.ts";
import { stopGame } from "../lib/game-process.ts";

async function main(): Promise<void> {
  const pids = await stopGame();
  console.log(pids.length === 0 ? "Game is not running." : `Stopped the game (pid ${pids.join(", ")}).`);
}

main().catch((error: unknown) => {
  console.error(`Error: ${errorMessage(error)}`);
  process.exit(1);
});
