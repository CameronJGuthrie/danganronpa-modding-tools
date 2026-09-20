import { useEffect, useMemo, useState } from "react";
import { roomName } from "../../data/room";
import { buildScriptTree, containsModified, filterScriptTree, type ScriptTreeNode } from "../../script/scriptTree";
import { ScriptSearchInput, ScriptSearchResults, useScriptSearch } from "./ScriptSearch";

type ScriptFileTreeProps = {
  /** Absolute folder whose `.linscript` files are listed; null until one is known. */
  directory: string | null;
  /** Relative path of the open script, or null. */
  selectedPath: string | null;
  /** Basenames of scripts that have a modified copy in the mod directory; starred in the tree. */
  modified: ReadonlySet<string>;
  /** Opens a script; a line number (from a search hit) is scrolled to once it is open. */
  onSelect: (relativePath: string, lineNumber?: number) => void;
  onChooseDirectory: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

/**
 * The leftmost panel of the Script Browser: a collapsible tree of every `.linscript` under the
 * chosen folder. Collapsed, it shrinks to a thin strip with a button to reopen it.
 */
export function ScriptFileTree({
  directory,
  selectedPath,
  modified,
  onSelect,
  onChooseDirectory,
  collapsed,
  onToggleCollapsed,
}: ScriptFileTreeProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [modifiedOnly, setModifiedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // Free-text search across every file; while it has a query the results replace the tree
  const [searchQuery, setSearchQuery] = useState("");
  const search = useScriptSearch(directory, searchQuery);
  const searching = searchQuery.trim() !== "";

  useEffect(() => {
    if (directory === null) {
      return;
    }
    let current = true;
    setError(null);
    window.electron
      .listScriptFiles(directory)
      .then((listed) => current && setFiles(listed))
      .catch((reason: unknown) => current && setError(String(reason)));
    return () => {
      current = false;
    };
  }, [directory]);

  const tree = useMemo(() => buildScriptTree(files), [files]);
  const visible = useMemo(
    () => filterScriptTree(tree, query, (file) => !modifiedOnly || modified.has(file.name)),
    [tree, query, modifiedOnly, modified],
  );
  // While filtering, every folder is shown open so the matches are visible
  const filtering = query.trim() !== "" || modifiedOnly;

  const toggleFolder = (path: string) => {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <aside className="flex w-8 shrink-0 flex-col items-center rounded bg-white dark:bg-slate-800 py-2 shadow-sm">
        <button
          type="button"
          className="rounded px-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={onToggleCollapsed}
          title="Show the script files"
          aria-label="Show the script files"
        >
          ▸
        </button>
        <span className="mt-2 text-xs text-slate-500 dark:text-slate-400 [writing-mode:vertical-rl]">Scripts</span>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-2 rounded bg-white dark:bg-slate-800 p-2 shadow-sm">
      <header className="flex items-center gap-1">
        <button
          type="button"
          className="rounded px-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={onToggleCollapsed}
          title="Hide the script files"
          aria-label="Hide the script files"
        >
          ▾
        </button>
        <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scripts</h3>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{files.length}</span>
        <button
          type="button"
          className="rounded bg-slate-200 px-1.5 text-xs hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
          onClick={onChooseDirectory}
          title={directory ?? "Choose the folder of .linscript files"}
        >
          Folder…
        </button>
      </header>
      <div className="flex gap-1">
        <input
          className="min-w-0 flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1 text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder="Filter"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          spellCheck={false}
        />
        <button
          type="button"
          className={`shrink-0 rounded px-1.5 text-xs ${
            modifiedOnly
              ? "bg-amber-300 text-amber-950 dark:bg-amber-500"
              : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
          }`}
          onClick={() => setModifiedOnly((previous) => !previous)}
          aria-pressed={modifiedOnly}
          title={
            modifiedOnly
              ? "Showing only modified scripts"
              : "Show only scripts with a modified copy in the mod directory"
          }
        >
          ★ {modified.size}
        </button>
      </div>
      <ScriptSearchInput query={searchQuery} onQueryChange={setSearchQuery} />
      <div className="min-h-0 flex-1 overflow-auto font-mono text-sm">
        {searching && directory !== null && (
          <ScriptSearchResults state={search} query={searchQuery} onSelect={onSelect} />
        )}
        {directory === null && (
          <p className="p-1 text-xs text-slate-500 dark:text-slate-400">
            No script folder. Run <code>pnpm run reset</code> to generate the workbench, or choose a folder.
          </p>
        )}
        {error !== null && <p className="p-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        {directory !== null && error === null && files.length === 0 && (
          <p className="p-1 text-xs text-slate-500 dark:text-slate-400">No .linscript files here.</p>
        )}
        {!searching && files.length > 0 && visible.length === 0 && (
          <p className="p-1 text-xs text-slate-500 dark:text-slate-400">
            {modifiedOnly ? "No modified scripts match." : "No scripts match."}
          </p>
        )}
        {!searching &&
          visible.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              open={open}
              forceOpen={filtering}
              selectedPath={selectedPath}
              modified={modified}
              onSelect={onSelect}
              onToggle={toggleFolder}
            />
          ))}
      </div>
    </aside>
  );
}

type TreeNodeProps = {
  node: ScriptTreeNode;
  depth: number;
  open: Set<string>;
  forceOpen: boolean;
  selectedPath: string | null;
  modified: ReadonlySet<string>;
  onSelect: (relativePath: string) => void;
  onToggle: (path: string) => void;
};

/** The star marking a modified file, or a folder that holds one. */
function Star({ shown, title }: { shown: boolean; title: string }) {
  return shown ? (
    <span className="shrink-0 text-amber-500 dark:text-amber-400" title={title}>
      ★
    </span>
  ) : null;
}

function TreeNode({ node, depth, open, forceOpen, selectedPath, modified, onSelect, onToggle }: TreeNodeProps) {
  const padding = { paddingLeft: `${depth * 0.75 + 0.25}rem` };
  const starred = containsModified(node, modified);

  if (node.kind === "file") {
    const selected = node.path === selectedPath;
    const room = roomName(node.name);
    return (
      <button
        type="button"
        className={`flex w-full items-center gap-1 rounded py-0.5 text-left ${
          selected ? "bg-blue-200 dark:bg-blue-900" : "hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
        style={padding}
        onClick={() => onSelect(node.path)}
        title={room === undefined ? node.path : `${node.path} — ${room}`}
      >
        <span className="shrink-0">{node.name.replace(/\.linscript$/, "")}</span>
        {room !== undefined && (
          <span className="truncate font-sans text-xs text-slate-500 dark:text-slate-400">{room}</span>
        )}
        <Star shown={starred} title="Modified: has a copy in the mod directory" />
      </button>
    );
  }

  const isOpen = forceOpen || open.has(node.path);
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 rounded py-0.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
        style={padding}
        onClick={() => onToggle(node.path)}
      >
        <span className="w-3 text-slate-500 dark:text-slate-400">{isOpen ? "▾" : "▸"}</span>
        <span>{node.name}</span>
        <Star shown={starred} title="Contains modified scripts" />
        <span className="ml-auto pr-1 text-xs text-slate-400 dark:text-slate-500">{countFiles(node)}</span>
      </button>
      {isOpen &&
        node.children.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            open={open}
            forceOpen={forceOpen}
            selectedPath={selectedPath}
            modified={modified}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

function countFiles(node: ScriptTreeNode): number {
  return node.kind === "file" ? 1 : node.children.reduce((total, child) => total + countFiles(child), 0);
}
