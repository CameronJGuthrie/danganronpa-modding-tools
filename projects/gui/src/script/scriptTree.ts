/**
 * A folder tree of `.linscript` files for the Script Browser's file panel. Real directories become
 * folders; a directory holding many flat files such as `e01_001_000.linscript` is additionally
 * grouped by the filename's first `_`-separated segment (the chapter), so the game's 1800-odd
 * scripts do not land in one endless list. The `"scene"` grouping nests a second level under each
 * chapter for the filename's second segment (the scene), so `e01_004_001` sits under `e01` > `004`.
 */

import { roomName } from "../data/room";

export type ScriptTreeNode =
  | { kind: "folder"; name: string; path: string; children: ScriptTreeNode[] }
  | { kind: "file"; name: string; path: string };

/** How a large flat directory is grouped: by chapter only, or by chapter and then scene. */
export type ScriptGrouping = "chapter" | "scene";

/** A directory with more files than this is grouped by filename prefix. */
const GROUP_THRESHOLD = 30;

export function buildScriptTree(
  relativePaths: readonly string[],
  grouping: ScriptGrouping = "chapter",
): ScriptTreeNode[] {
  const root: ScriptTreeNode = { kind: "folder", name: "", path: "", children: [] };

  for (const relative of relativePaths) {
    const segments = relative.split("/");
    let folder = root;
    for (const segment of segments.slice(0, -1)) {
      folder = childFolder(folder, segment);
    }
    folder.children.push({ kind: "file", name: segments[segments.length - 1], path: relative });
  }

  return groupLargeFolders(root, grouping).children;
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

function groupLargeFolders(
  folder: ScriptTreeNode & { kind: "folder" },
  grouping: ScriptGrouping,
): ScriptTreeNode & { kind: "folder" } {
  const folders = folder.children
    .filter((child) => child.kind === "folder")
    .map((child) => groupLargeFolders(child, grouping));
  const files = folder.children.filter((child) => child.kind === "file");

  if (files.length <= GROUP_THRESHOLD) {
    return { ...folder, children: [...folders, ...files] };
  }

  const depth = grouping === "scene" ? 2 : 1;
  return { ...folder, children: [...folders, ...groupBySegment(files, folder.path, 0, depth)] };
}

/**
 * `files` grouped into folders by their `segment`th `_`-separated name segment, recursing until
 * `depth` segments are used. Files with no such segment are left ungrouped at that level.
 */
function groupBySegment(
  files: readonly ScriptTreeNode[],
  parentPath: string,
  segment: number,
  depth: number,
): ScriptTreeNode[] {
  const groups = new Map<string, ScriptTreeNode[]>();
  const ungrouped: ScriptTreeNode[] = [];
  for (const file of files) {
    const key = file.name.replace(/\.linscript$/, "").split("_")[segment];
    if (key === undefined) {
      ungrouped.push(file);
      continue;
    }
    const group = groups.get(key) ?? [];
    group.push(file);
    groups.set(key, group);
  }
  const grouped: ScriptTreeNode[] = [...groups].map(([key, children]) => {
    const path = `${parentPath}#${key}`;
    return {
      kind: "folder",
      name: key,
      path,
      children: segment + 1 < depth ? groupBySegment(children, path, segment + 1, depth) : children,
    };
  });
  return [...grouped, ...ungrouped];
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
