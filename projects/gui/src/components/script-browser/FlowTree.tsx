import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import type { FlowNode } from "../../script/controlFlow";
import { kindStyles } from "./kindStyles";

type FlowTreeProps = {
  root: FlowNode;
  /** Null while "View All" is active so no node reads as selected. */
  selectedId: string | null;
  collapsed: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  viewAll: boolean;
  onViewAll: () => void;
  className?: string;
};

type FlowRow = { node: FlowNode; depth: number };

/** The tree in display order, skipping the descendants of collapsed nodes. */
function flatten(root: FlowNode, collapsed: Set<string>): FlowRow[] {
  const rows: FlowRow[] = [];
  const visit = (node: FlowNode, depth: number) => {
    rows.push({ node, depth });
    if (!collapsed.has(node.id)) {
      for (const child of node.children) {
        visit(child, depth + 1);
      }
    }
  };
  visit(root, 0);
  return rows;
}

/**
 * The control-flow tree as a scrollable, virtualised list: only the rows in view are mounted, so
 * scripts with thousands of blocks stay responsive.
 */
export function FlowTree({
  root,
  selectedId,
  collapsed,
  onSelect,
  onToggle,
  viewAll,
  onViewAll,
  className = "",
}: FlowTreeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => flatten(root, collapsed), [root, collapsed]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 28,
    overscan: 10,
    getItemKey: (index) => rows[index].node.id,
  });

  // A node selected from elsewhere (a jump, a nested-node row) is brought into view
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    const index = rows.findIndex((row) => row.node.id === selectedId);
    if (index !== -1) {
      virtualizer.scrollToIndex(index, { align: "auto" });
    }
  }, [selectedId, rows, virtualizer]);

  return (
    <div ref={scrollRef} className={`overflow-auto ${className}`}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const { node, depth } = rows[row.index];
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <FlowTreeRow
                node={node}
                depth={depth}
                isCollapsed={collapsed.has(node.id)}
                isSelected={node.id === selectedId || (node.kind === "script" && viewAll)}
                onSelect={onSelect}
                onToggle={onToggle}
                viewAll={node.kind === "script" ? viewAll : undefined}
                onViewAll={node.kind === "script" ? onViewAll : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FlowTreeRowProps = {
  node: FlowNode;
  depth: number;
  isCollapsed: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  viewAll?: boolean;
  onViewAll?: () => void;
};

function FlowTreeRow({
  node,
  depth,
  isCollapsed,
  isSelected,
  onSelect,
  onToggle,
  viewAll,
  onViewAll,
}: FlowTreeRowProps) {
  const hasChildren = node.children.length > 0;
  const style = kindStyles[node.kind];

  return (
    <div
      className={`flex items-center gap-1 rounded pr-2 ${isSelected ? "bg-blue-200 dark:bg-blue-900" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
      style={{ paddingLeft: `${depth * 0.75}rem` }}
    >
      <button
        type="button"
        className="w-5 shrink-0 text-slate-500 dark:text-slate-400"
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
        {node.subtitle && <span className="truncate text-xs text-slate-500 dark:text-slate-400">{node.subtitle}</span>}
      </button>
      {onViewAll && (
        <button
          type="button"
          className={`ml-auto shrink-0 rounded px-1.5 text-xs ${viewAll ? "bg-blue-500 text-white" : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"}`}
          onClick={onViewAll}
          title="Show every line of the script with indentation"
        >
          View All
        </button>
      )}
    </div>
  );
}
