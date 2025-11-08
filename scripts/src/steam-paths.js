/**
 * steam-paths.js
 *
 * Cross-platform utility for finding Steam game directories and data.
 * Supports Windows, Linux, and macOS.
 */

import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';

const GAME_NAME = 'Danganronpa Trigger Happy Havoc';
const GAME_APP_ID = '413410';

/**
 * Returns an array of potential Steam game directory paths for all platforms.
 * Ordered by likelihood/preference.
 */
function getPotentialGamePaths() {
  const paths = [];

  if (process.platform === 'win32') {
    // Windows Steam paths
    paths.push(
      `C:\\Program Files (x86)\\Steam\\steamapps\\common\\${GAME_NAME}`,
      `C:\\Program Files\\Steam\\steamapps\\common\\${GAME_NAME}`
    );

    // Check common alternate drive letters for custom Steam libraries
    for (const drive of ['D', 'E', 'F']) {
      paths.push(
        `${drive}:\\SteamLibrary\\steamapps\\common\\${GAME_NAME}`,
        `${drive}:\\Steam\\steamapps\\common\\${GAME_NAME}`
      );
    }
  } else if (process.platform === 'darwin') {
    // macOS Steam paths
    paths.push(
      join(homedir(), `Library/Application Support/Steam/steamapps/common/${GAME_NAME}`)
    );
  } else {
    // Linux Steam paths
    paths.push(
      join(homedir(), `.local/share/Steam/steamapps/common/${GAME_NAME}`),
      join(homedir(), `.steam/steam/steamapps/common/${GAME_NAME}`)
    );
  }

  return paths;
}

/**
 * Returns an array of potential Proton compatdata paths (Linux only).
 */
function getPotentialCompatDataPaths() {
  if (process.platform !== 'linux') {
    return [];
  }

  return [
    join(homedir(), `.local/share/Steam/steamapps/compatdata/${GAME_APP_ID}`),
    join(homedir(), `.steam/steam/steamapps/compatdata/${GAME_APP_ID}`)
  ];
}

/**
 * Finds and returns the Steam game directory path.
 * Returns null if not found.
 *
 * @returns {string|null} The game directory path, or null if not found
 */
export function findGameDirectory() {
  const paths = getPotentialGamePaths();

  for (const dir of paths) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

/**
 * Finds and returns the Proton compatdata directory path (Linux only).
 * Returns null if not found or not on Linux.
 *
 * @returns {string|null} The compatdata directory path, or null if not found
 */
export function findCompatDataDirectory() {
  const paths = getPotentialCompatDataPaths();

  for (const dir of paths) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  return null;
}

/**
 * Gets the game directory or throws an error with helpful message.
 *
 * @throws {Error} If game directory is not found
 * @returns {string} The game directory path
 */
export function getGameDirectoryOrThrow() {
  const gameDir = findGameDirectory();

  if (!gameDir) {
    const error = new Error(
      `Game directory not found. Make sure "${GAME_NAME}" is installed via Steam.\n` +
      'Checked the following locations:\n' +
      getPotentialGamePaths().map(p => `  - ${p}`).join('\n')
    );
    throw error;
  }

  return gameDir;
}
