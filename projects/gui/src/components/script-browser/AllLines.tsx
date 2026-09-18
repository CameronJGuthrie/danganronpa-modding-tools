import { isBlank, type ScriptLine } from "../../script/controlFlow";
import { ActionRow, canJumpFrom } from "./ActionRow";
import { InsertLineRow } from "./InsertLineButton";
import { kindStyles } from "./kindStyles";
import type { LineEditing } from "./LineEditing";

type AllLinesProps = {
  title: string;
  lines: readonly ScriptLine[];
  lineIds: readonly number[];
  labelOwners: Map<number, string>;
  editing: LineEditing;
  editingLine: number | null;
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
  onSelect,
  onJump,
}: AllLinesProps) {
  const actionCount = lines.filter((line) => !isBlank(line)).length;
  const lastLine = lines[lines.length - 1]?.lineNumber ?? 0;
  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${kindStyles.script.badge}`}>
            {kindStyles.script.label}
          </span>
          <h2 className="font-mono text-lg">{title}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">all lines</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{actionCount} actions</p>
      </header>
      <ol className="flex flex-col pt-2 font-mono text-sm">
        {lines.map((line) => (
          <ActionRow
            // Keyed by the line's stable id, not its number: inserting a line then adds one row
            // instead of rebuilding every row below it (and their dropdowns)
            key={lineIds[line.lineNumber - 1]}
            item={{ kind: "line", line }}
            indent={line.depth}
            isEditing={editingLine === line.lineNumber}
            canJump={canJumpFrom(line, labelOwners)}
            editing={editing}
            onSelect={onSelect}
            onJump={onJump}
          />
        ))}
        <InsertLineRow lineNumber={lastLine + 1} editing={editing} />
      </ol>
    </div>
  );
}
