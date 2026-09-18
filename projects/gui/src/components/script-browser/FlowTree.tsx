import type { FlowNode } from "../../script/controlFlow";
import { kindStyles } from "./kindStyles";

type FlowTreeProps = {
  node: FlowNode;
  depth: number;
  /** Null while "View All" is active so no node reads as selected. */
  selectedId: string | null;
  collapsed: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  viewAll?: boolean;
  onViewAll?: () => void;
};

export function FlowTree({
  node,
  depth,
  selectedId,
  collapsed,
  onSelect,
  onToggle,
  viewAll,
  onViewAll,
}: FlowTreeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const isSelected = node.id === selectedId || (node.kind === "script" && viewAll === true);
  const style = kindStyles[node.kind];

  return (
    <div>
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
          {node.subtitle && (
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{node.subtitle}</span>
          )}
        </button>
        {node.kind === "script" && onViewAll && (
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
