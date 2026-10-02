import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

/** Settings persisted across runs in the app's user-data folder. */
type Settings = {
  /** The workbench folder chosen by the user; absent until one is picked. */
  workbenchRoot?: string;
};

function settingsFile(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

export function readSettings(): Settings {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
    return typeof parsed === "object" && parsed !== null ? (parsed as Settings) : {};
  } catch {
    return {};
  }
}

export function writeSettings(patch: Partial<Settings>): void {
  const file = settingsFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ ...readSettings(), ...patch }, null, 2)}\n`, "utf8");
}

export type WorkbenchRoot = {
  /** The folder in use, or null when none is configured and no repository workbench was found. */
  path: string | null;
  /** True when the folder comes from the saved setting rather than the repository fallback. */
  configured: boolean;
};

/**
 * The workbench folder: the saved setting when it names an existing folder, otherwise the
 * repository's `workbench/` found relative to the app (which lives in `projects/gui`), so a
 * development checkout works with no configuration.
 */
export function workbenchRoot(appPath: string): WorkbenchRoot {
  const configured = readSettings().workbenchRoot;
  if (configured !== undefined && isDirectory(configured)) {
    return { path: configured, configured: true };
  }
  const candidates = [path.resolve(appPath, "../../workbench"), path.resolve(appPath, "../../../workbench")];
  return { path: candidates.find(isDirectory) ?? null, configured: false };
}

/** Save `folder` as the workbench root. */
export function setWorkbenchRoot(folder: string): void {
  writeSettings({ workbenchRoot: folder });
}

function isDirectory(folder: string): boolean {
  try {
    return fs.statSync(folder).isDirectory();
  } catch {
    return false;
  }
}
