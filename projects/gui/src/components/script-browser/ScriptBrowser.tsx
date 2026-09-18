import { useCallback, useMemo, useRef, useState } from "react";
import { buildControlFlow, parseScriptLines } from "../../script/controlFlow";
import { e00_002_000 } from "../../script/e00_002_000";
import {
  createDocument,
  insertDocumentBlankLine,
  lineCount,
  replaceDocumentLine,
  replaceDocumentSource,
} from "../../script/editSource";
import { applyObjectNames, parseObjectNames, referencedObjectIds } from "../../script/objectNames";
import { ActionPanel } from "./ActionPanel";
import { AllLines } from "./AllLines";
import { FlowTree } from "./FlowTree";
import type { AfterSave, LineEditing } from "./LineEditing";
import { NodeDetails } from "./NodeDetails";
import { ObjectNamesPanel } from "./ObjectNamesPanel";

const SCRIPT_NAME = "e00_002_000";

/** Two-pane script viewer and editor: a control-flow tree on the left, the selected node's lines on the right. */
export function ScriptBrowser() {
  const [document, setDocument] = useState(() => createDocument(e00_002_000));
  const { source, lineIds } = document;
  // Node ids are assigned in source order, so an in-place line edit keeps the same tree and selection
  const flow = useMemo(() => buildControlFlow(source, SCRIPT_NAME), [source]);
  const [selectedId, setSelectedId] = useState<string>(flow.root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  // "View All" shows every line of the script, indented, instead of one node's actions. It is the
  // starting view; picking a node in the tree switches to that node's actions.
  const [viewAll, setViewAll] = useState(true);
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
    <div className="flex gap-4 bg-slate-100 dark:bg-slate-900 p-4 h-[calc(100vh-9rem)] min-h-0">
      <aside className="flex w-96 shrink-0 flex-col gap-2 rounded bg-white dark:bg-slate-800 p-2 shadow-sm">
        <div className="min-h-0 flex-1 overflow-auto">
          <FlowTree
            node={flow.root}
            depth={0}
            selectedId={viewAll ? null : selected.id}
            collapsed={collapsed}
            onSelect={selectNode}
            onToggle={toggleCollapsed}
            viewAll={viewAll}
            onViewAll={() => setViewAll(true)}
          />
        </div>
        <div className="max-h-[40%] shrink-0 overflow-auto">
          <ObjectNamesPanel names={objectNames} uses={objectUses} readOnly={readOnly} onRename={renameObject} />
        </div>
      </aside>
      <section className="relative flex-1 min-w-0 rounded bg-white dark:bg-slate-800 shadow-sm">
        <ActionPanel readOnly={readOnly} onToggleReadOnly={() => setReadOnly((previous) => !previous)} />
        <div className="h-full overflow-auto p-4">
          {viewAll ? (
            <AllLines
              title={flow.root.title}
              lines={allLines}
              lineIds={lineIds}
              labelOwners={flow.labelOwners}
              editing={editing}
              editingLine={editingLine}
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
    </div>
  );
}
