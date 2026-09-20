/**
 * A folder tree of `.linscript` files for the Script Browser's file panel. Real directories become
 * folders; a directory holding many flat files such as `e01_001_000.linscript` is additionally
 * grouped by the filename's first `_`-separated segment (the chapter), so the game's 1800-odd
 * scripts do not land in one endless list.
 */

import { roomName } from "../data/room";

export type ScriptTreeNode =
  | { kind: "folder"; name: string; path: string; children: ScriptTreeNode[] }
  | { kind: "file"; name: string; path: string };

/** A directory with more files than this is grouped by filename prefix. */
const GROUP_THRESHOLD = 30;

export function buildScriptTree(relativePaths: readonly string[]): ScriptTreeNode[] {
  const root: ScriptTreeNode = { kind: "folder", name: "", path: "", children: [] };

  for (const relative of relativePaths) {
    const segments = relative.split("/");
    let folder = root;
    for (const segment of segments.slice(0, -1)) {
      folder = childFolder(folder, segment);
    }
    folder.children.push({ kind: "file", name: segments[segments.length - 1], path: relative });
  }

  return groupLargeFolders(root).children;
}

function childFolder(parent: ScriptTreeNode & { kind: "folder" }, name: string): ScriptTreeNode & { kind: "folder" } {
  const existing = parent.children.find((child) => child.kind === "folder" && child.name === name);
  if (existing?.kind === "folder") {
    return existing;
  }
  const folder: ScriptTreeNode & { kind: "folder" } = {
    kind: "folder",
    name,
    path: parent.path === "" ? name : `${parent.path}/${name}`,
    children: [],
  };
  parent.children.push(folder);
  return folder;
}

function groupLargeFolders(folder: ScriptTreeNode & { kind: "folder" }): ScriptTreeNode & { kind: "folder" } {
  const folders = folder.children.filter((child) => child.kind === "folder").map(groupLargeFolders);
  const files = folder.children.filter((child) => child.kind === "file");

  if (files.length <= GROUP_THRESHOLD) {
    return { ...folder, children: [...folders, ...files] };
  }

  const groups = new Map<string, ScriptTreeNode[]>();
  for (const file of files) {
    const prefix = file.name.split("_")[0];
    const group = groups.get(prefix) ?? [];
    group.push(file);
    groups.set(prefix, group);
  }
  const grouped: ScriptTreeNode[] = [...groups].map(([prefix, children]) => ({
    kind: "folder",
    name: prefix,
    path: `${folder.path}#${prefix}`,
    children,
  }));
  return { ...folder, children: [...folders, ...grouped] };
}

/**
 * The tree with only the files whose path or room name contains `query` (case-insensitive) and
 * that pass `keep`, plus the folders leading to them.
 */
export function filterScriptTree(
  nodes: readonly ScriptTreeNode[],
  query: string,
  keep: (file: ScriptTreeNode & { kind: "file" }) => boolean = () => true,
): ScriptTreeNode[] {
  const needle = query.trim().toLowerCase();
  const result: ScriptTreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "file") {
      const room = roomName(node.name)?.toLowerCase() ?? "";
      if ((node.path.toLowerCase().includes(needle) || room.includes(needle)) && keep(node)) {
        result.push(node);
      }
    } else {
      const children = filterScriptTree(node.children, needle, keep);
      if (children.length > 0) {
        result.push({ ...node, children });
      }
    }
  }
  return result;
}

/** True when `node` is a modified file, or a folder holding one anywhere beneath it. */
export function containsModified(node: ScriptTreeNode, modified: ReadonlySet<string>): boolean {
  return node.kind === "file"
    ? modified.has(node.name)
    : node.children.some((child) => containsModified(child, modified));
}
