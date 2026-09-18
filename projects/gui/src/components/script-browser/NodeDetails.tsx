import { type FlowNode, isBlank } from "../../script/controlFlow";
import { ActionRow, canJumpFrom } from "./ActionRow";
import { InsertLineRow } from "./InsertLineButton";
import { kindStyles } from "./kindStyles";
import type { LineEditing } from "./LineEditing";

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
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
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
      <ol className="flex flex-col pt-2 font-mono text-sm">
        {node.items.map((item) => (
          <ActionRow
            key={item.kind === "line" ? `line-${lineIds[item.line.lineNumber - 1]}` : `node-${item.node.id}`}
            item={item}
            isEditing={item.kind === "line" && editingLine === item.line.lineNumber}
            canJump={item.kind === "line" && canJumpFrom(item.line, labelOwners)}
            editing={editing}
            onSelect={onSelect}
            onJump={onJump}
          />
        ))}
        <InsertLineRow lineNumber={node.endLine + 1} editing={editing} />
      </ol>
    </div>
  );
}
