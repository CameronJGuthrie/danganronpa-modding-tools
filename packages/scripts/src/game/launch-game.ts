#!/usr/bin/env node

/**
 * Launches the game through Steam with a mod installed.
 *
 *   pnpm run game              # the mod "default"
 *   pnpm run game --mod silly
 *
 * The mod's WADs come from its last build (`workbench/build/<mod>/<wad>.wad`, written by
 * `pnpm run build --mod <name>`, which installs them too) and are copied into the game
 * directory before Steam is started, so switching mods is a copy rather than a rebuild. A mod
 * that has never been built is an error rather than a launch of whatever was installed last.
 * A running game is stopped first, since it holds the WADs and Steam will not start a second copy.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { errorMessage } from "../lib/errors.ts";
import { stopGame } from "../lib/game-process.ts";
import { modBuildDir, modNameFromArgs } from "../lib/mods.ts";
import { getGameDirectoryOrThrow } from "../lib/steam-paths.ts";

const DANGANRONPA_APP_ID = "413410";

/** Copy every built WAD of `mod` into the game directory; returns their names. */
async function installMod(mod: string): Promise<string[]> {
  const buildDir = modBuildDir(mod);
  const wads = existsSync(buildDir) ? (await readdir(buildDir)).filter((name) => name.endsWith(".wad")) : [];
  if (wads.length === 0) {
    throw new Error(`Mod ${mod} has not been built (no .wad in ${buildDir}); run "pnpm run build --mod ${mod}" first`);
  }
  const gameDir = getGameDirectoryOrThrow();
  for (const wad of wads) {
    await copyFile(join(buildDir, wad), join(gameDir, wad));
  }
  return wads.map((wad) => basename(wad));
}

async function main(): Promise<void> {
  const mod = modNameFromArgs(process.argv.slice(2));
  const stopped = await stopGame();
  if (stopped.length > 0) {
    console.log("Stopped the running game.");
  }
  const wads = await installMod(mod);
  console.log(`Installed mod ${mod}: ${wads.join(", ")}`);

  console.log(`Launching Danganronpa (Steam App ID: ${DANGANRONPA_APP_ID}) in new terminal...`);

  // Launch Steam in a new terminal window
  const terminal = spawn("x-terminal-emulator", ["-e", `steam -applaunch ${DANGANRONPA_APP_ID}`], {
    stdio: "ignore",
    detached: true,
  });
  terminal.unref();

  console.log("Game launch initiated.");
}

main().catch((error: unknown) => {
  console.error(`Error: ${errorMessage(error)}`);
  process.exit(1);
});
