import { useCallback, useEffect, useRef, useState } from "react";
import { useAppContext } from "../../state/AppContext";
import { ScriptFileTree } from "./ScriptFileTree";
import { ScriptView } from "./ScriptView";

const STORAGE = {
  directory: "scriptViewer.directory",
  file: "scriptViewer.file",
  collapsed: "scriptViewer.treeCollapsed",
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
 * The Script Viewer tab: a collapsible tree of `.linscript` files on the far left, and the
 * read-only view of the chosen file beside it. The folder, the open file and the panel state are
 * remembered.
 */
export function ScriptViewer() {
  const { workbenchRoot, workbenchRootLoaded } = useAppContext();
  const [directory, setDirectory] = useState<string | null>(() => read(STORAGE.directory));
  const [selectedPath, setSelectedPath] = useState<string | null>(() => read(STORAGE.file));
  const [collapsed, setCollapsed] = useState(() => read(STORAGE.collapsed) === "true");
  const [script, setScript] = useState<OpenScript | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Scripts with a copy in the mod directory, starred in the tree
  const [modified, setModified] = useState<ReadonlySet<string>>(() => new Set());
  // A line to scroll to in the open script, set when a search hit is picked; a fresh object each time
  const [reveal, setReveal] = useState<{ line: number } | null>(null);

  const selectScript = useCallback((relativePath: string, line?: number) => {
    setSelectedPath(relativePath);
    setReveal(line === undefined ? null : { line });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the mod directory lives in the workbench, so refresh when it changes
  useEffect(() => {
    window.electron
      .listModifiedScripts()
      .then((names) => setModified(new Set(names)))
      .catch(() => setModified(new Set()));
  }, [workbenchRoot]);

  // Open the workbench's decompiled scripts when no folder has been chosen yet, when the
  // remembered folder no longer exists (e.g. it was renamed), and again whenever a different
  // workbench is chosen
  const appliedRoot = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!workbenchRootLoaded) {
      return;
    }
    const rootChanged = appliedRoot.current !== undefined && appliedRoot.current !== workbenchRoot;
    appliedRoot.current = workbenchRoot;
    let current = true;
    const openDefault = () =>
      window.electron.getDefaultScriptDirectory().then((found) => {
        if (!current || found === null) {
          return;
        }
        setDirectory(found);
        setSelectedPath(null);
        setScript(null);
      });
    if (directory === null) {
      void openDefault();
    } else if (rootChanged) {
      void openDefault();
    } else {
      window.electron.listScriptFiles(directory).catch(openDefault);
    }
    return () => {
      current = false;
    };
  }, [directory, workbenchRoot, workbenchRootLoaded]);

  // Load the selected file, or its copy in the mod directory when there is one
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
            // Decompiled files start with a byte-order mark, which the line parser does not expect
            source: loaded.source.replace(/^﻿/, ""),
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
        onSelect={selectScript}
        onChooseDirectory={chooseDirectory}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((previous) => !previous)}
      />
      {open !== null ? (
        <ScriptView
          key={open.filePath}
          fromMod={open.fromMod}
          scriptName={scriptName(open.path)}
          source={open.source}
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
