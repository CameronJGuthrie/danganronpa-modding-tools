import { useCallback, useEffect, useRef, useState } from "react";
import { ScriptEditor } from "./ScriptEditor";
import { ScriptFileTree } from "./ScriptFileTree";

const STORAGE = {
  directory: "scriptBrowser.directory",
  file: "scriptBrowser.file",
  collapsed: "scriptBrowser.treeCollapsed",
} as const;

type OpenScript = {
  /** Relative path in the tree that was picked. */
  path: string;
  /** Absolute path of the file read, which is the mod copy when one exists. */
  filePath: string;
  source: string;
  fromMod: boolean;
};

/**
 * The Script Browser tab: a collapsible tree of `.linscript` files on the far left, and the editor
 * for the chosen file beside it. The folder, the open file and the panel state are remembered.
 */
export function ScriptBrowser() {
  const [directory, setDirectory] = useState<string | null>(() => read(STORAGE.directory));
  const [selectedPath, setSelectedPath] = useState<string | null>(() => read(STORAGE.file));
  const [collapsed, setCollapsed] = useState(() => read(STORAGE.collapsed) === "true");
  const [script, setScript] = useState<OpenScript | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Scripts with a copy in the mod directory, starred in the tree; refreshed after every save
  const [modified, setModified] = useState<ReadonlySet<string>>(() => new Set());
  // A line to scroll to in the open script, set when a search hit is picked; a fresh object each time
  const [reveal, setReveal] = useState<{ line: number } | null>(null);

  // The open editor's save-if-dirty step, so switching scripts never drops edits
  const flush = useRef<(() => Promise<boolean>) | null>(null);
  const registerFlush = useCallback((step: () => Promise<boolean>) => {
    flush.current = step;
    return () => {
      if (flush.current === step) {
        flush.current = null;
      }
    };
  }, []);

  const selectScript = useCallback(async (relativePath: string, line?: number) => {
    // Save the current script first; a failed save keeps it open so nothing is lost
    if (flush.current !== null && !(await flush.current())) {
      return;
    }
    setSelectedPath(relativePath);
    setReveal(line === undefined ? null : { line });
  }, []);

  const refreshModified = useCallback(() => {
    window.electron
      .listModifiedScripts()
      .then((names) => setModified(new Set(names)))
      .catch(() => setModified(new Set()));
  }, []);

  useEffect(refreshModified, [refreshModified]);

  // Fall back to the repository workbench when no folder has been chosen yet
  useEffect(() => {
    if (directory !== null) {
      return;
    }
    window.electron.getDefaultScriptDirectory().then((found) => {
      if (found !== null) {
        setDirectory(found);
      }
    });
  }, [directory]);

  // Load the selected file, or its saved copy in the mod directory when there is one. Edits made
  // in the editor are held there and lost when switching files without saving.
  useEffect(() => {
    if (directory === null || selectedPath === null) {
      return;
    }
    let current = true;
    setLoadError(null);
    window.electron
      .loadScript(`${directory}/${selectedPath}`)
      .then((loaded) => {
        if (current) {
          setScript({
            path: selectedPath,
            filePath: loaded.path,
            fromMod: loaded.fromMod,
            // Decompiled files start with a byte-order mark, which the editor's line rewriting does not expect
            source: loaded.source.replace(/^\uFEFF/, ""),
          });
        }
      })
      .catch((reason: unknown) => current && setLoadError(String(reason)));
    return () => {
      current = false;
    };
  }, [directory, selectedPath]);

  useEffect(() => write(STORAGE.directory, directory), [directory]);
  useEffect(() => write(STORAGE.file, selectedPath), [selectedPath]);
  useEffect(() => write(STORAGE.collapsed, String(collapsed)), [collapsed]);

  const chooseDirectory = useCallback(async () => {
    const result = await window.electron.openDirectoryDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      if (flush.current !== null && !(await flush.current())) {
        return;
      }
      setDirectory(result.filePaths[0]);
      setSelectedPath(null);
      setScript(null);
    }
  }, []);

  const open = script !== null && script.path === selectedPath ? script : null;

  return (
    <div className="flex gap-4 bg-slate-100 dark:bg-slate-900 p-4 h-[calc(100vh-9rem)] min-h-0">
      <ScriptFileTree
        directory={directory}
        selectedPath={selectedPath}
        modified={modified}
        onSelect={(relativePath, line) => void selectScript(relativePath, line)}
        onChooseDirectory={chooseDirectory}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((previous) => !previous)}
      />
      {open !== null ? (
        <ScriptEditor
          key={open.filePath}
          filePath={open.filePath}
          fromMod={open.fromMod}
          scriptName={scriptName(open.path)}
          initialSource={open.source}
          onSaved={refreshModified}
          registerFlush={registerFlush}
          reveal={reveal}
        />
      ) : (
        <section className="flex flex-1 items-center justify-center rounded bg-white dark:bg-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loadError ?? (selectedPath === null ? "Pick a script from the tree." : "Loading…")}
          </p>
        </section>
      )}
    </div>
  );
}

function scriptName(relativePath: string): string {
  return relativePath.replace(/^.*\//, "").replace(/\.linscript$/, "");
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // storage unavailable; the choice just does not persist
  }
}
