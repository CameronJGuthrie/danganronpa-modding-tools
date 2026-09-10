import { useCallback, useMemo, useState } from "react";
import { buildControlFlow, type FlowItem, type FlowNode, type FlowNodeKind, firstNumber } from "../script/controlFlow";
import { e00_002_000 } from "../script/e00_002_000";

const SCRIPT_NAME = "e00_002_000";

const kindStyles: Record<FlowNodeKind, { badge: string; label: string }> = {
  script: { badge: "bg-slate-700 text-white", label: "Script" },
  block: { badge: "bg-slate-300 text-slate-900", label: "Block" },
  handlerGroup: { badge: "bg-amber-200 text-amber-900", label: "Handlers" },
  handler: { badge: "bg-amber-100 text-amber-900", label: "Handler" },
  menu: { badge: "bg-violet-200 text-violet-900", label: "Menu" },
  option: { badge: "bg-violet-100 text-violet-900", label: "Option" },
};

export function ScriptBrowser() {
  const flow = useMemo(() => buildControlFlow(e00_002_000, SCRIPT_NAME), []);
  const [selectedId, setSelectedId] = useState<string>(flow.root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const selected = flow.nodesById.get(selectedId) ?? flow.root;

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

  const jumpToLabel = useCallback(
    (label: number) => {
      const ownerId = flow.labelOwners.get(label);
      if (ownerId) {
        setSelectedId(ownerId);
      }
    },
    [flow],
  );

  return (
    <div className="flex gap-4 bg-slate-100 p-4 h-[calc(100vh-9rem)] min-h-0">
      <aside className="w-96 shrink-0 overflow-auto rounded bg-white p-2 shadow-sm">
        <FlowTree
          node={flow.root}
          depth={0}
          selectedId={selected.id}
          collapsed={collapsed}
          onSelect={setSelectedId}
          onToggle={toggleCollapsed}
        />
      </aside>
      <section className="flex-1 min-w-0 overflow-auto rounded bg-white p-4 shadow-sm">
        <NodeDetails node={selected} labelOwners={flow.labelOwners} onSelect={setSelectedId} onJump={jumpToLabel} />
      </section>
    </div>
  );
}

type FlowTreeProps = {
  node: FlowNode;
  depth: number;
  selectedId: string;
  collapsed: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
};

function FlowTree({ node, depth, selectedId, collapsed, onSelect, onToggle }: FlowTreeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const isSelected = node.id === selectedId;
  const style = kindStyles[node.kind];

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded pr-2 ${isSelected ? "bg-blue-200" : "hover:bg-slate-100"}`}
        style={{ paddingLeft: `${depth * 0.75}rem` }}
      >
        <button
          type="button"
          className="w-5 shrink-0 text-slate-500"
          onClick={() => onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {hasChildren ? (isCollapsed ? "▸" : "▾") : ""}
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-baseline gap-2 py-1 text-left"
          onClick={() => onSelect(node.id)}
        >
          <span className={`shrink-0 rounded px-1 text-[10px] font-semibold uppercase ${style.badge}`}>
            {style.label}
          </span>
          <span className="shrink-0 font-mono text-sm">{node.title}</span>
          {node.subtitle && <span className="truncate text-xs text-slate-500">{node.subtitle}</span>}
        </button>
      </div>
      {hasChildren && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <FlowTree
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type NodeDetailsProps = {
  node: FlowNode;
  labelOwners: Map<number, string>;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

function NodeDetails({ node, labelOwners, onSelect, onJump }: NodeDetailsProps) {
  const style = kindStyles[node.kind];
  const lineCount = node.items.filter((item) => item.kind === "line").length;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <h2 className="font-mono text-lg">{node.title}</h2>
        </div>
        <p className="text-xs text-slate-500">
          Lines {node.startLine}–{node.endLine} · {lineCount} action{lineCount === 1 ? "" : "s"}
          {node.children.length > 0 && ` · ${node.children.length} nested`}
        </p>
      </header>

      {node.items.length === 0 ? (
        <p className="text-sm text-slate-500">No actions.</p>
      ) : (
        <ol className="flex flex-col font-mono text-sm">
          {node.items.map((item) => (
            <ActionRow key={itemKey(item)} item={item} labelOwners={labelOwners} onSelect={onSelect} onJump={onJump} />
          ))}
        </ol>
      )}
    </div>
  );
}

function itemKey(item: FlowItem): string {
  return item.kind === "line" ? `line-${item.line.lineNumber}` : item.node.id;
}

type ActionRowProps = {
  item: FlowItem;
  labelOwners: Map<number, string>;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

function ActionRow({ item, labelOwners, onSelect, onJump }: ActionRowProps) {
  if (item.kind === "node") {
    const child = item.node;
    const style = kindStyles[child.kind];
    return (
      <li className="flex items-baseline gap-2 border-l-4 border-slate-300 bg-slate-50 px-2 py-1">
        <span className="w-10 shrink-0 text-right text-slate-400">{child.startLine}</span>
        <button
          type="button"
          className="flex items-baseline gap-2 text-left hover:underline"
          onClick={() => onSelect(child.id)}
        >
          <span className={`rounded px-1 text-[10px] font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <span>{child.title}</span>
          {child.subtitle && <span className="text-xs text-slate-500">{child.subtitle}</span>}
        </button>
      </li>
    );
  }

  const { line } = item;
  const isLabel = line.functionName === "Label";
  const isGoto = line.functionName === "Goto";
  const isBranch = line.functionName === "IfTrue" || line.functionName === "EvaluateFlag";
  const target = isGoto ? firstNumber(line) : undefined;
  const canJump = target !== undefined && labelOwners.has(target);

  let rowClass = "hover:bg-slate-50";
  if (isLabel) {
    rowClass = "bg-emerald-50 text-emerald-900";
  } else if (isGoto) {
    rowClass = "bg-sky-50 text-sky-900";
  } else if (isBranch) {
    rowClass = "bg-orange-50 text-orange-900";
  }

  return (
    <li className={`flex items-baseline gap-2 px-2 py-0.5 ${rowClass}`}>
      <span className="w-10 shrink-0 text-right text-slate-400">{line.lineNumber}</span>
      <span className="whitespace-pre-wrap break-all">{line.text}</span>
      {isGoto && (
        <button
          type="button"
          className="ml-auto shrink-0 rounded bg-sky-200 px-1.5 text-xs disabled:opacity-40"
          disabled={!canJump}
          onClick={() => target !== undefined && onJump(target)}
          title={canJump ? `Go to Label(${target})` : "Label not found in this script"}
        >
          jump →
        </button>
      )}
    </li>
  );
}
