import { useMemo } from "react";
import { type FlowItem, isBlank, type LabelRef, type ScriptLine } from "../../script/controlFlow";
import { kindStyles } from "./kindStyles";
import { VirtualActionList } from "./VirtualActionList";

type AllLinesProps = {
  title: string;
  lines: readonly ScriptLine[];
  labelOwners: Map<LabelRef, string>;
  reveal?: { line: number } | null;
  onSelect: (id: string) => void;
  onJump: (label: LabelRef) => void;
};

/** Every line of the script in source order, indented by its block depth. */
export function AllLines({ title, lines, labelOwners, reveal, onSelect, onJump }: AllLinesProps) {
  const actionCount = lines.filter((line) => !isBlank(line)).length;
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
        labelOwners={labelOwners}
        reveal={reveal}
        indentByDepth
        onSelect={onSelect}
        onJump={onJump}
      />
    </div>
  );
}
