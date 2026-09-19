import { type MouseEvent, memo } from "react";
import { type FlowItem, firstNumber, type ScriptLine } from "../../script/controlFlow";
import { lineComment } from "../../script/lineComment";
import { ArgumentEditor } from "./ArgumentEditor";
import { editableArguments } from "./editableArguments";
import { InsertLineButton } from "./InsertLineButton";
import { kindStyles } from "./kindStyles";
import type { LineEditing } from "./LineEditing";
import { LineTextField } from "./LineTextField";

/** True when a Goto line targets a label that exists in this script. */
export function canJumpFrom(line: ScriptLine, labelOwners: Map<number, string>): boolean {
  if (line.functionName !== "Goto") {
    return false;
  }
  const target = firstNumber(line);
  return target !== undefined && labelOwners.has(target);
}

type ActionRowProps = {
  item: FlowItem;
  /** Extra indentation levels, used by the all-lines view to reproduce the source layout. */
  indent?: number;
  isEditing: boolean;
  /** For Goto lines: whether the target label exists in this script. */
  canJump: boolean;
  editing: LineEditing;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

/** Width of the gutter left of the line numbers that holds the insert-line buttons. */
const GUTTER_CLASS = "pl-6";

/**
 * Rows are memoised on the content they display rather than object identity, because every edit
 * re-parses the source and produces fresh line objects. With hundreds of rows, most holding
 * dropdowns, re-rendering them all on each click or keystroke is what made editing feel slow.
 */
export const ActionRow = memo(ActionRowInner, (previous, next) => {
  if (
    previous.indent !== next.indent ||
    previous.isEditing !== next.isEditing ||
    previous.canJump !== next.canJump ||
    previous.editing !== next.editing ||
    previous.onSelect !== next.onSelect ||
    previous.onJump !== next.onJump ||
    previous.item.kind !== next.item.kind
  ) {
    return false;
  }
  if (previous.item.kind === "line" && next.item.kind === "line") {
    const a = previous.item.line;
    const b = next.item.line;
    return a.lineNumber === b.lineNumber && a.depth === b.depth && a.text === b.text;
  }
  if (previous.item.kind === "node" && next.item.kind === "node") {
    const a = previous.item.node;
    const b = next.item.node;
    return (
      a.id === b.id &&
      a.kind === b.kind &&
      a.startLine === b.startLine &&
      a.title === b.title &&
      a.subtitle === b.subtitle
    );
  }
  return false;
});

function ActionRowInner({ item, indent = 0, isEditing, canJump, editing, onSelect, onJump }: ActionRowProps) {
  const { readOnly, onEditLine, onStartEdit } = editing;

  if (item.kind === "node") {
    const child = item.node;
    const style = kindStyles[child.kind];
    return (
      <div
        className={`relative flex items-baseline gap-2 border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 ${GUTTER_CLASS} pr-2 py-1`}
      >
        <InsertLineButton lineNumber={child.startLine} editing={editing} />
        <span className="w-10 shrink-0 text-right text-slate-400 dark:text-slate-500">{child.startLine}</span>
        <button
          type="button"
          className="flex items-baseline gap-2 text-left hover:underline"
          onClick={() => onSelect(child.id)}
        >
          <span className={`rounded px-1 text-[10px] font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <span>{child.title}</span>
          {child.subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{child.subtitle}</span>}
        </button>
      </div>
    );
  }

  const { line } = item;
  const editable = editableArguments[line.functionName];
  const comment = lineComment(line);
  const isLabel = line.functionName === "Label";
  const isGoto = line.functionName === "Goto";
  const isBranch = line.functionName === "Then" || line.functionName === "IfFlag";
  const target = isGoto ? firstNumber(line) : undefined;

  let rowClass = "hover:bg-slate-50 dark:hover:bg-slate-700";
  if (isLabel) {
    rowClass = "bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200";
  } else if (isGoto) {
    rowClass = "bg-sky-50 dark:bg-sky-950 text-sky-900 dark:text-sky-200";
  } else if (isBranch) {
    rowClass = "bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-200";
  }

  // Clicking the row opens the text field, unless the click landed on a control that has its own job
  const startEdit = (event: MouseEvent<HTMLDivElement>) => {
    if (readOnly || isEditing || (event.target as HTMLElement).closest("button, select, input")) {
      return;
    }
    onStartEdit(line.lineNumber);
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the row is a click target for opening the text field; the field itself is keyboard-operable
    // biome-ignore lint/a11y/noStaticElementInteractions: same as above
    <div
      className={`relative flex items-baseline gap-2 ${GUTTER_CLASS} pr-2 py-0.5 ${rowClass} ${readOnly || isEditing ? "" : "cursor-text"}`}
      onClick={startEdit}
    >
      <InsertLineButton lineNumber={line.lineNumber} editing={editing} />
      <span className="w-10 shrink-0 text-right text-slate-400 dark:text-slate-500">{line.lineNumber}</span>
      {indent > 0 && <span className="shrink-0" style={{ width: `${indent * 1.5}rem` }} />}
      {isEditing ? (
        <LineTextField key={line.lineNumber} line={line} editing={editing} />
      ) : editable ? (
        <ArgumentEditor line={line} spec={editable} readOnly={readOnly} onEditLine={onEditLine} />
      ) : (
        <span className="min-h-5 flex-1 whitespace-pre-wrap break-all">{line.text}</span>
      )}
      {comment !== undefined && (
        <span className="shrink-0 pl-2 text-slate-400 dark:text-slate-500 italic"># {comment}</span>
      )}
      {isGoto && (
        <button
          type="button"
          className="ml-auto shrink-0 rounded bg-sky-200 dark:bg-sky-800 px-1.5 text-xs disabled:opacity-40"
          disabled={!canJump}
          onClick={() => target !== undefined && onJump(target)}
          title={canJump ? `Go to Label(${target})` : "Label not found in this script"}
        >
          jump →
        </button>
      )}
    </div>
  );
}
