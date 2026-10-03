import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeScript, roomName } from "../../data/room";
import { buildControlFlow, type LabelRef, parseScriptLines } from "../../script/controlFlow";
import { buildFlowGraph } from "../../script/flowGraph";
import { parseObjectNames, referencedObjectIds } from "../../script/objectNames";
import { AllLines } from "./AllLines";
import { FlowDiagram } from "./FlowDiagram";
import { FlowTree } from "./FlowTree";
import { NodeDetails } from "./NodeDetails";
import { ObjectNamesPanel } from "./ObjectNamesPanel";

/** What the right-hand pane shows: the script's lines, or the flowchart. */
export type ScriptPane = "script" | "flow";

export const SCRIPT_PANES: Record<ScriptPane, string> = {
  script: "Script",
  flow: "Flow",
};

type ScriptViewProps = {
  /** True when the source is the copy in the mod directory rather than the file picked in the tree. */
  fromMod?: boolean;
  pane: ScriptPane;
  onPaneChange: (pane: ScriptPane) => void;
  /** Shown as the root of the flow tree, e.g. the file name without extension. */
  scriptName: string;
  source: string;
  /** A line to scroll to and mark in the all-lines view, e.g. a search hit; a new object re-triggers it. */
  reveal?: { line: number } | null;
};

/**
 * Two-pane read-only script view: a control-flow tree on the left and, on the right, either the
 * selected node's lines or the flowchart of the whole script, switched by a pair of sub-tabs.
 * Mount it with a `key` per script so opening another file starts from fresh state.
 */
export function ScriptView({
  fromMod = false,
  pane,
  onPaneChange,
  scriptName,
  source,
  reveal = null,
}: ScriptViewProps) {
  const flow = useMemo(() => buildControlFlow(source, scriptName), [source, scriptName]);
  const graph = useMemo(() => (pane === "flow" ? buildFlowGraph(flow, source) : null), [pane, flow, source]);
  const [selectedId, setSelectedId] = useState<string>(flow.root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  // "View All" shows every line of the script, indented, instead of one node's actions. It is the
  // starting view; picking a node in the tree switches to that node's actions.
  const [viewAll, setViewAll] = useState(true);
  // A line picked in the flowchart; shown in the all-lines view like a search hit, until the next hit
  const [ownReveal, setOwnReveal] = useState<{ line: number } | null>(null);
  // A revealed line lives in the all-lines view, so showing one switches back to it
  useEffect(() => {
    if (reveal !== null) {
      setViewAll(true);
      setOwnReveal(null);
    }
  }, [reveal]);
  const shownReveal = ownReveal ?? reveal;
  const allLines = useMemo(() => (viewAll ? parseScriptLines(source) : []), [viewAll, source]);
  // Per-script object names from the Meta() block, and which ids the body actually refers to
  const objectNames = useMemo(() => parseObjectNames(source), [source]);
  const objectUses = useMemo(() => referencedObjectIds(source, objectNames), [source, objectNames]);
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

  const showLine = useCallback(
    (line: number) => {
      setOwnReveal({ line });
      setViewAll(true);
      onPaneChange("script");
    },
    [onPaneChange],
  );

  const jumpToLabel = useCallback((label: LabelRef) => {
    const ownerId = flowRef.current.labelOwners.get(label);
    if (ownerId) {
      setViewAll(false);
      setSelectedId(ownerId);
    }
  }, []);

  return (
    <>
      <aside className="flex w-96 shrink-0 flex-col gap-2 rounded bg-white dark:bg-slate-800 p-2 shadow-sm">
        <header className="flex items-baseline gap-2 border-b border-slate-200 px-1 pb-1 dark:border-slate-700">
          <h2 className="font-mono text-sm font-semibold">{scriptName}</h2>
          <span className="truncate text-sm text-slate-600 dark:text-slate-300" title={describeScript(scriptName)}>
            {roomName(scriptName) ?? describeScript(scriptName)}
          </span>
          {fromMod && (
            <span
              className="ml-auto shrink-0 whitespace-nowrap text-xs text-amber-700 dark:text-amber-300"
              title="This script has a copy in the mod directory, which is what is shown"
            >
              ★ mod copy
            </span>
          )}
        </header>
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
          <ObjectNamesPanel names={objectNames} uses={objectUses} />
        </div>
      </aside>
      <section className="relative flex flex-1 min-w-0 flex-col rounded bg-white dark:bg-slate-800 shadow-sm">
        <PaneTabs pane={pane} onPaneChange={onPaneChange} />
        {pane === "script" ? (
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
            {viewAll ? (
              <AllLines
                title={flow.root.title}
                lines={allLines}
                labelOwners={flow.labelOwners}
                reveal={shownReveal}
                onSelect={selectNode}
                onJump={jumpToLabel}
              />
            ) : (
              <NodeDetails node={selected} labelOwners={flow.labelOwners} onSelect={selectNode} onJump={jumpToLabel} />
            )}
          </div>
        ) : (
          graph !== null && (
            <FlowDiagram
              graph={graph}
              highlight={viewAll || selected.kind === "script" ? null : selected}
              onShowLine={showLine}
            />
          )
        )}
      </section>
    </>
  );
}

/** The Script / Flow sub-tabs along the top of the right-hand pane. */
function PaneTabs({ pane, onPaneChange }: { pane: ScriptPane; onPaneChange: (pane: ScriptPane) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Script pane"
      className="flex shrink-0 gap-1 border-b border-slate-200 px-4 pt-2 pb-2 dark:border-slate-700"
    >
      {(Object.keys(SCRIPT_PANES) as ScriptPane[]).map((name) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={pane === name}
          className={`rounded px-2.5 py-0.5 text-sm ${
            pane === name
              ? "bg-blue-500 font-semibold text-white"
              : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
          }`}
          onClick={() => onPaneChange(name)}
        >
          {SCRIPT_PANES[name]}
        </button>
      ))}
    </div>
  );
}
