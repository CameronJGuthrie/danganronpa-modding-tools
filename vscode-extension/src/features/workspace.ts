import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { log, logError } from "../output";

const MARKER_FILE = ".danganronpa-working-root";

let cachedRootPath: string | null = null;

/**
 * Finds the root directory by searching for a marker file
 * starting from workspace folders and searching recursively downward
 */
export function findRootDirectory(): string | null {
  if (cachedRootPath) {
    log(`Using cached root path: ${cachedRootPath}`);
    return cachedRootPath;
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }

  // Search each workspace folder
  for (const folder of workspaceFolders) {
    const result = searchForMarkerFile(folder.uri.fsPath);
    if (result) {
      cachedRootPath = result;
      log(`Found and cached root path: ${cachedRootPath}`);
      return result;
    }
  }

  return null;
}

/**
 * Recursively searches for the marker file in a directory and its subdirectories
 */
function searchForMarkerFile(dir: string): string | null {
  // Check if marker file exists in current directory
  const markerPath = path.join(dir, MARKER_FILE);
  if (fs.existsSync(markerPath)) {
    return dir;
  }

  // Search subdirectories
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDirPath = path.join(dir, entry.name);
        const result = searchForMarkerFile(subDirPath);
        if (result) {
          return result;
        }
      }
    }
  } catch (err) {
    // Handle permission errors or other issues reading directory
    logError(`Error reading directory ${dir}: ${err}`);
  }

  return null;
}

/**
 * Checks if we're in a Danganronpa modding workspace by looking for the marker file
 */
export function isRootWorkspace(): boolean {
  return findRootDirectory() !== null;
}

/**
 * Clears the cached root path (useful for testing or if the marker file is created/deleted)
 */
export function clearRootCache(): void {
  cachedRootPath = null;
}
