import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { log } from "../output";

const EXTENSION_ID = "lindecompilerhelper";
const WORKBENCH_ROOT_KEY = "workbenchRoot";
const CHOOSE_WORKBENCH_ROOT_COMMAND = `${EXTENSION_ID}.chooseWorkbenchRoot`;

/**
 * The workbench folder (extracted game data, `base_files/`, `exploration/`, `mod/`), from
 * the `lindecompilerhelper.workbenchRoot` setting. A relative value is resolved against the first
 * workspace folder, so the default `workbench` finds the repository's own workbench with no
 * configuration. Null when the setting is empty or the folder does not exist.
 */
export function getWorkbenchRoot(): string | null {
  const configured = vscode.workspace.getConfiguration(EXTENSION_ID).get<string>(WORKBENCH_ROOT_KEY, "").trim();
  if (configured === "") {
    return null;
  }

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const resolved = path.isAbsolute(configured)
    ? configured
    : workspaceFolder === undefined
      ? null
      : path.resolve(workspaceFolder, configured);

  if (resolved === null || !isDirectory(resolved)) {
    log(`Workbench root "${configured}" does not resolve to a folder`);
    return null;
  }
  return resolved;
}

/**
 * The workbench root, or, when none is configured, an offer to pick one. Resolves to null when
 * the user dismisses the prompt.
 */
export async function requireWorkbenchRoot(): Promise<string | null> {
  const root = getWorkbenchRoot();
  if (root !== null) {
    return root;
  }
  const choice = await vscode.window.showErrorMessage(
    "Danganronpa extension: the workbench folder is not configured.",
    "Choose folder…",
  );
  return choice === undefined ? null : chooseWorkbenchRoot();
}

/**
 * Ask for the workbench folder and store it in the `workbenchRoot` setting: in the workspace
 * settings when a workspace is open (the workbench belongs to the folder, not the user), otherwise
 * in the user settings. Returns the chosen folder, or null when the dialog was cancelled.
 */
async function chooseWorkbenchRoot(): Promise<string | null> {
  const picked = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Use as workbench",
    title: "Choose the Danganronpa workbench folder",
  });
  const folder = picked?.[0]?.fsPath;
  if (folder === undefined) {
    return null;
  }

  const target =
    vscode.workspace.workspaceFolders === undefined
      ? vscode.ConfigurationTarget.Global
      : vscode.ConfigurationTarget.Workspace;
  await vscode.workspace.getConfiguration(EXTENSION_ID).update(WORKBENCH_ROOT_KEY, folder, target);
  log(`Workbench root set to ${folder}`);
  vscode.window.showInformationMessage(`Workbench folder set to ${folder}`);
  return folder;
}

/** Register the "choose workbench folder" command and the activation check that offers it. */
export function registerWorkbenchRoot(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerCommand(CHOOSE_WORKBENCH_ROOT_COMMAND, chooseWorkbenchRoot));

  const root = getWorkbenchRoot();
  if (root !== null) {
    log(`Workbench root: ${root}`);
    return;
  }
  void vscode.window
    .showWarningMessage(
      "Danganronpa extension: no workbench folder found. Set lindecompilerhelper.workbenchRoot to use script selection, navigation and audio playback.",
      "Choose folder…",
    )
    .then((choice) => (choice === undefined ? undefined : chooseWorkbenchRoot()));
}

function isDirectory(folder: string): boolean {
  try {
    return fs.statSync(folder).isDirectory();
  } catch {
    return false;
  }
}
