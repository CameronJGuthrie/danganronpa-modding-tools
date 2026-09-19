import { type FlowNode, isBlank } from "../../script/controlFlow";
import { kindStyles } from "./kindStyles";
import type { LineEditing } from "./LineEditing";
import { VirtualActionList } from "./VirtualActionList";

type NodeDetailsProps = {
  node: FlowNode;
  lineIds: readonly number[];
  labelOwners: Map<number, string>;
  editing: LineEditing;
  editingLine: number | null;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

/** One control-flow node: its header plus its lines and nested nodes in source order. */
export function NodeDetails({ node, lineIds, labelOwners, editing, editingLine, onSelect, onJump }: NodeDetailsProps) {
  const style = kindStyles[node.kind];
  const lineCount = node.items.filter((item) => item.kind === "line" && !isBlank(item.line)).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <h2 className="font-mono text-lg">{node.title}</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Lines {node.startLine}–{node.endLine} · {lineCount} action{lineCount === 1 ? "" : "s"}
          {node.children.length > 0 && ` · ${node.children.length} nested`}
        </p>
      </header>

      {node.items.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No actions.</p>}
      <VirtualActionList
        items={node.items}
        lineIds={lineIds}
        labelOwners={labelOwners}
        editing={editing}
        editingLine={editingLine}
        trailingInsertLine={node.endLine + 1}
        onSelect={onSelect}
        onJump={onJump}
      />
    </div>
  );
}
