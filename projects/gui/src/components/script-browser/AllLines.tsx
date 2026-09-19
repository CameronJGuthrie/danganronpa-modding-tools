import { useMemo } from "react";
import { type FlowItem, isBlank, type ScriptLine } from "../../script/controlFlow";
import { kindStyles } from "./kindStyles";
import type { LineEditing } from "./LineEditing";
import { VirtualActionList } from "./VirtualActionList";

type AllLinesProps = {
  title: string;
  lines: readonly ScriptLine[];
  lineIds: readonly number[];
  labelOwners: Map<number, string>;
  editing: LineEditing;
  editingLine: number | null;
  reveal?: { line: number } | null;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

/** Every line of the script in source order, indented by its block depth. */
export function AllLines({
  title,
  lines,
  lineIds,
  labelOwners,
  editing,
  editingLine,
  reveal,
  onSelect,
  onJump,
}: AllLinesProps) {
  const actionCount = lines.filter((line) => !isBlank(line)).length;
  const lastLine = lines[lines.length - 1]?.lineNumber ?? 0;
  const items = useMemo<FlowItem[]>(() => lines.map((line) => ({ kind: "line", line })), [lines]);
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${kindStyles.script.badge}`}>
            {kindStyles.script.label}
          </span>
          <h2 className="font-mono text-lg">{title}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">all lines</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{actionCount} actions</p>
      </header>
      <VirtualActionList
        items={items}
        lineIds={lineIds}
        labelOwners={labelOwners}
        editing={editing}
        editingLine={editingLine}
        reveal={reveal}
        trailingInsertLine={lastLine + 1}
        indentByDepth
        onSelect={onSelect}
        onJump={onJump}
      />
    </div>
  );
}
