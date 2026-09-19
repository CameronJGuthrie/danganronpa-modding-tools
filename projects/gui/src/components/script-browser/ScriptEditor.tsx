import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildControlFlow, parseScriptLines } from "../../script/controlFlow";
import {
  createDocument,
  insertDocumentBlankLine,
  lineCount,
  replaceDocumentLine,
  replaceDocumentSource,
} from "../../script/editSource";
import { applyObjectNames, parseObjectNames, referencedObjectIds } from "../../script/objectNames";
import { useBeforeRunGame } from "../../state/RunGameContext";
import { ActionPanel } from "./ActionPanel";
import { AllLines } from "./AllLines";
import { FlowTree } from "./FlowTree";
import type { AfterSave, LineEditing } from "./LineEditing";
import { NodeDetails } from "./NodeDetails";
import { ObjectNamesPanel } from "./ObjectNamesPanel";

export type SaveStatus = { kind: "ok" | "error"; text: string; detail: string };

type ScriptEditorProps = {
  /** Absolute path of the open file; saves write here and into the mod directory. */
  filePath: string;
  /** True when the file is the saved copy in the mod directory rather than the one picked in the tree. */
  fromMod?: boolean;
  /** Shown as the root of the flow tree, e.g. the file name without extension. */
  scriptName: string;
  /** The script's source when opened; edits are held in the editor's own state. */
  initialSource: string;
  /** Called after a successful save, e.g. so the file tree can refresh its modified markers. */
  onSaved?: () => void;
  /**
   * Registers the step that saves pending edits (a no-op when clean), so the browser can flush the
   * script before switching to another. Returns the unregister function.
   */
  registerFlush?: (flush: () => Promise<boolean>) => () => void;
  /** A line to scroll to and mark in the all-lines view, e.g. a search hit; a new object re-triggers it. */
  reveal?: { line: number } | null;
};

/**
 * Two-pane script viewer and editor: a control-flow tree on the left, the selected node's lines on
 * the right. Mount it with a `key` per script so opening another file starts from fresh state.
 */
export function ScriptEditor({
  filePath,
  fromMod = false,
  scriptName,
  initialSource,
  onSaved,
  registerFlush,
  reveal = null,
}: ScriptEditorProps) {
  const [document, setDocument] = useState(() => createDocument(initialSource));
  const { source, lineIds } = document;
  // What is on disk, as far as this editor knows; the source is dirty when it differs
  const [savedSource, setSavedSource] = useState(initialSource);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus | undefined>();
  const dirty = source !== savedSource;
  // Node ids are assigned in source order, so an in-place line edit keeps the same tree and selection
  const flow = useMemo(() => buildControlFlow(source, scriptName), [source, scriptName]);
  const [selectedId, setSelectedId] = useState<string>(flow.root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  // "View All" shows every line of the script, indented, instead of one node's actions. It is the
  // starting view; picking a node in the tree switches to that node's actions.
  const [viewAll, setViewAll] = useState(true);
  // A revealed line lives in the all-lines view, so showing one switches back to it
  useEffect(() => {
    if (reveal !== null) {
      setViewAll(true);
    }
  }, [reveal]);
  // Read-only disables every dropdown so the script cannot be edited by accident
  const [readOnly, setReadOnly] = useState(false);
  // The line whose text is open in an inline text field; null when nothing is being edited
  const [editingLine, setEditingLine] = useState<number | null>(null);
  const allLines = useMemo(() => (viewAll ? parseScriptLines(source) : []), [viewAll, source]);
  // Per-script object names from the Meta() block, and which ids the body actually refers to
  const objectNames = useMemo(() => parseObjectNames(source), [source]);
  const objectUses = useMemo(() => referencedObjectIds(source, objectNames), [source, objectNames]);
  // Latest values for callbacks that must keep their identity across renders
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const savedSourceRef = useRef(savedSource);
  savedSourceRef.current = savedSource;
  const flowRef = useRef(flow);
  flowRef.current = flow;

  const selected = flow.nodesById.get(selectedId) ?? flow.root;

  const selectNode = useCallback((id: string) => {
    setViewAll(false);
    setSelectedId(id);
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const jumpToLabel = useCallback((label: number) => {
    const ownerId = flowRef.current.labelOwners.get(label);
    if (ownerId) {
      setViewAll(false);
      setSelectedId(ownerId);
    }
  }, []);

  const editLine = useCallback((lineNumber: number, text: string) => {
    setDocument((previous) => replaceDocumentLine(previous, lineNumber, text));
  }, []);

  const insertLine = useCallback((lineNumber: number) => {
    setDocument((previous) => insertDocumentBlankLine(previous, lineNumber));
    // Line numbers below the insertion point shift, so an open edit there would move to the wrong row
    setEditingLine(null);
  }, []);

  const saveLine = useCallback((lineNumber: number, text: string, then: AfterSave) => {
    setDocument((previous) => {
      const saved = replaceDocumentLine(previous, lineNumber, text);
      return then === "insertBelow" ? insertDocumentBlankLine(saved, lineNumber + 1) : saved;
    });
    if (then === "stop") {
      setEditingLine(null);
    } else if (then === "insertBelow") {
      setEditingLine(lineNumber + 1);
    } else {
      setEditingLine(lineNumber + 1 <= lineCount(sourceRef.current) ? lineNumber + 1 : null);
    }
  }, []);

  const cancelEdit = useCallback(() => setEditingLine(null), []);

  const save = useCallback(async (): Promise<boolean> => {
    const text = sourceRef.current;
    setSaving(true);
    try {
      const result = await window.electron.saveScript(filePath, text);
      setSavedSource(text);
      onSaved?.();
      const copied = result.written.map(shortPath).join(" and ");
      setSaveStatus({
        kind: "ok",
        text: result.readOnly ? "Saved to mod (original is read-only)" : "Saved",
        detail: result.readOnly
          ? `Written to ${copied}; ${shortPath(result.readOnly)} is read-only`
          : `Written to ${copied}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveStatus({ kind: "error", text: "Save failed", detail: message });
      return false;
    } finally {
      setSaving(false);
    }
    return true;
  }, [filePath, onSaved]);

  // Pending edits are saved before the game is built and run, and before another script is opened
  const saveIfDirty = useCallback(
    () => (sourceRef.current === savedSourceRef.current ? Promise.resolve(true) : save()),
    [save],
  );
  useBeforeRunGame(saveIfDirty);
  useEffect(() => registerFlush?.(saveIfDirty), [registerFlush, saveIfDirty]);

  // Ctrl+S / Cmd+S saves from anywhere in the editor, including an open line text field
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        // Let a focused text field commit its edit (on blur) before the source is read
        (window.document.activeElement as HTMLElement | null)?.blur?.();
        setTimeout(() => void save(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const renameObject = useCallback((id: number, name: string) => {
    setDocument((previous) => {
      const names = new Map(parseObjectNames(previous.source));
      if (name === "") {
        names.delete(id);
      } else {
        names.set(id, name);
      }
      return replaceDocumentSource(previous, applyObjectNames(previous.source, names));
    });
    // The Meta block may grow or shrink, so a line open for editing there could move
    setEditingLine(null);
  }, []);

  const editing = useMemo<LineEditing>(
    () => ({
      readOnly,
      onEditLine: editLine,
      onStartEdit: setEditingLine,
      onSaveLine: saveLine,
      onCancelEdit: cancelEdit,
      onInsertLine: insertLine,
    }),
    [readOnly, editLine, saveLine, cancelEdit, insertLine],
  );

  return (
    <>
      <aside className="flex w-96 shrink-0 flex-col gap-2 rounded bg-white dark:bg-slate-800 p-2 shadow-sm">
        <FlowTree
          className="min-h-0 flex-1"
          root={flow.root}
          selectedId={viewAll ? null : selected.id}
          collapsed={collapsed}
          onSelect={selectNode}
          onToggle={toggleCollapsed}
          viewAll={viewAll}
          onViewAll={() => setViewAll(true)}
        />
        <div className="max-h-[40%] shrink-0 overflow-auto">
          <ObjectNamesPanel names={objectNames} uses={objectUses} readOnly={readOnly} onRename={renameObject} />
        </div>
      </aside>
      <section className="relative flex-1 min-w-0 rounded bg-white dark:bg-slate-800 shadow-sm">
        <ActionPanel
          readOnly={readOnly}
          onToggleReadOnly={() => setReadOnly((previous) => !previous)}
          dirty={dirty}
          saving={saving}
          onSave={() => void save()}
          status={saveStatus}
          fromMod={fromMod}
        />
        <div className="flex h-full min-h-0 flex-col p-4">
          {viewAll ? (
            <AllLines
              title={flow.root.title}
              lines={allLines}
              lineIds={lineIds}
              labelOwners={flow.labelOwners}
              editing={editing}
              editingLine={editingLine}
              reveal={reveal}
              onSelect={selectNode}
              onJump={jumpToLabel}
            />
          ) : (
            <NodeDetails
              node={selected}
              lineIds={lineIds}
              labelOwners={flow.labelOwners}
              editing={editing}
              editingLine={editingLine}
              onSelect={selectNode}
              onJump={jumpToLabel}
            />
          )}
        </div>
      </section>
    </>
  );
}

/** The tail of a path that tells the two save locations apart: the workbench-relative part. */
function shortPath(absolute: string): string {
  const index = absolute.indexOf("/workbench/");
  return index === -1 ? absolute : absolute.slice(index + "/workbench/".length);
}
