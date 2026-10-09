import { readdir } from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { pakEntryIndex } from "danganronpa-scripts/src/lib/mod-scripts.ts";
import { log } from "../output";
import { getWorkbenchRoot } from "./workspace";

/**
 * Context key holding the paths of every extracted pak folder in the workbench, so the
 * "Select PAK for Modding" menu item can be gated on `resourcePath in <key>`: a `when` clause
 * cannot look inside a folder, and the folder's name says nothing (`script_pak_e00` and `mtb_s38`
 * are both paks).
 */
const PAK_FOLDERS_CONTEXT_KEY = "lindecompilerhelper.pakFolders";

/**
 * Only the read-only copy of the game data is scanned: the mod's organised scene directories
 * (`chapter_01/scene_005/103.linscript`) are index-named too but are not paks, and selecting
 * from `mod/` makes no sense anyway.
 */
const EXPLORATION_DIR = "exploration";

/**
 * Whether a directory listing is that of an extracted pak: at least one entry, and every entry
 * named by its index (`0000.lin`, `0003.txt`, `0002_NewGame.linscript`), which is how the pak
 * extractor names what it unpacks and nothing else in the workbench is named.
 */
export function isPakFolderListing(names: readonly string[]): boolean {
  return names.length > 0 && names.every((name) => pakEntryIndex(name) !== null);
}

/** Every extracted pak folder below `dir`, walking its subdirectories. */
export async function findPakFolders(dir: string): Promise<string[]> {
  const found: string[] = [];
  const pending = [dir];
  while (pending.length > 0) {
    const dir = pending.pop() as string;
    let entries: import("node:fs").Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    if (isPakFolderListing(entries.map((entry) => entry.name))) {
      found.push(dir);
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        pending.push(path.join(dir, entry.name));
      }
    }
  }
  return found;
}

/** Rescan the workbench and publish the pak folders to the context key. */
async function refreshPakFolders(): Promise<void> {
  const root = getWorkbenchRoot();
  const folders = root === null ? [] : await findPakFolders(path.join(root, EXPLORATION_DIR));
  await vscode.commands.executeCommand("setContext", PAK_FOLDERS_CONTEXT_KEY, folders);
  log(`Pak folders: ${folders.length} found${root === null ? "" : ` under ${root}`}`);
}

/**
 * Keep the pak-folder context key current: scan on activation, when the workbench root setting
 * changes, and (debounced) when a first entry file appears or disappears anywhere in
 * `exploration/`, which is what `pnpm run reset` and the pak extractor do.
 */
export function registerPakFolders(context: vscode.ExtensionContext): void {
  let timer: NodeJS.Timeout | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void refreshPakFolders(), 2000);
  };

  void refreshPakFolders();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("lindecompilerhelper.workbenchRoot")) {
        void refreshPakFolders();
      }
    }),
  );

  const root = getWorkbenchRoot();
  if (root !== null) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(path.join(root, EXPLORATION_DIR), "**/0000.*"),
      false,
      true,
      false,
    );
    watcher.onDidCreate(schedule);
    watcher.onDidDelete(schedule);
    context.subscriptions.push(watcher, { dispose: () => clearTimeout(timer) });
  }
}
