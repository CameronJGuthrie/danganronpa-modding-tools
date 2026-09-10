/**
 * steam-paths.ts
 *
 * Cross-platform utility for finding Steam game directories and data.
 * Supports Windows, Linux, and macOS.
 */

import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { PROJECT_ROOT } from "./paths.ts";

const GAME_NAME = "Danganronpa Trigger Happy Havoc";
const GAME_APP_ID = "413410";

/** Name of the environment variable that overrides Steam game directory detection. */
const STEAM_DIR_ENV = "STEAM_DIR";

// Load `.env` from the repository root so `STEAM_DIR=...` can be set without exporting it.
// Variables already present in the environment take precedence over the file.
try {
  process.loadEnvFile(join(PROJECT_ROOT, ".env"));
} catch {
  // No .env file - fall back to platform defaults.
}

/**
 * Returns the game directory from `STEAM_DIR` (environment or repository `.env`),
 * or null if it is unset or empty.
 */
function getEnvGamePath(): string | null {
  const value = process.env[STEAM_DIR_ENV]?.trim();
  return value ? value : null;
}

/**
 * Returns an array of potential Steam game directory paths for all platforms.
 * Ordered by likelihood/preference.
 */
function getPotentialGamePaths(): string[] {
  const paths: string[] = [];

  if (process.platform === "win32") {
    // Windows Steam paths
    paths.push(
      `C:\\Program Files (x86)\\Steam\\steamapps\\common\\${GAME_NAME}`,
      `C:\\Program Files\\Steam\\steamapps\\common\\${GAME_NAME}`,
    );

    // Check common alternate drive letters for custom Steam libraries
    for (const drive of ["D", "E", "F"]) {
      paths.push(
        `${drive}:\\SteamLibrary\\steamapps\\common\\${GAME_NAME}`,
        `${drive}:\\Steam\\steamapps\\common\\${GAME_NAME}`,
      );
    }
  } else if (process.platform === "darwin") {
    // macOS Steam paths
    paths.push(join(homedir(), `Library/Application Support/Steam/steamapps/common/${GAME_NAME}`));
  } else {
    // Linux Steam paths
    paths.push(
      join(homedir(), `.local/share/Steam/steamapps/common/${GAME_NAME}`),
      join(homedir(), `.steam/steam/steamapps/common/${GAME_NAME}`),
    );
  }

  return paths;
}

/**
 * Returns an array of potential Proton compatdata paths (Linux only).
 */
function getPotentialCompatDataPaths(): string[] {
  if (process.platform !== "linux") {
    return [];
  }

  return [
    join(homedir(), `.local/share/Steam/steamapps/compatdata/${GAME_APP_ID}`),
    join(homedir(), `.steam/steam/steamapps/compatdata/${GAME_APP_ID}`),
  ];
}

/**
 * Returns the list of game directory candidates to check: the `STEAM_DIR`
 * override if set, otherwise the platform defaults.
 */
function getGamePathCandidates(): string[] {
  const envPath = getEnvGamePath();
  return envPath ? [envPath] : getPotentialGamePaths();
}

/**
 * Finds and returns the Steam game directory path.
 * Uses `STEAM_DIR` if set, otherwise searches the platform's default Steam locations.
 * Returns null if not found.
 */
export function findGameDirectory(): string | null {
  for (const dir of getGamePathCandidates()) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

/**
 * Finds and returns the Proton compatdata directory path (Linux only).
 * Returns null if not found or not on Linux.
 */
export function findCompatDataDirectory(): string | null {
  const paths = getPotentialCompatDataPaths();

  for (const dir of paths) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

/**
 * Gets the game directory, or throws an error listing where it looked.
 */
export function getGameDirectoryOrThrow(): string {
  const gameDir = findGameDirectory();

  if (!gameDir) {
    const error = new Error(
      `Game directory not found. Make sure "${GAME_NAME}" is installed via Steam, ` +
        `or set ${STEAM_DIR_ENV} in the environment or the repository .env file.\n` +
        "Checked the following locations:\n" +
        getGamePathCandidates()
          .map((p) => `  - ${p}`)
          .join("\n"),
    );
    throw error;
  }

  return gameDir;
}
