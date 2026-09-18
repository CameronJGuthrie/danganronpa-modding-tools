import type { LineEditing } from "./LineEditing";

type InsertLineButtonProps = {
  /** The new blank line takes this number; the row it sits on top of moves down. */
  lineNumber: number;
  editing: LineEditing;
};

/**
 * A circled plus in the gutter, centred on the boundary above its row. Clicking it inserts a blank
 * line there. Hidden in read-only mode.
 */
export function InsertLineButton({ lineNumber, editing }: InsertLineButtonProps) {
  if (editing.readOnly) {
    return null;
  }
  return (
    <button
      type="button"
      className="absolute top-0 left-0.5 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-[11px] leading-none text-slate-400 dark:text-slate-400 opacity-30 hover:border-blue-500 hover:text-blue-600 hover:opacity-100 dark:hover:text-blue-300"
      onClick={() => editing.onInsertLine(lineNumber)}
      title={`Insert an empty line before line ${lineNumber}`}
      aria-label={`Insert an empty line before line ${lineNumber}`}
    >
      +
    </button>
  );
}

/** A zero-height final row so the last boundary of a list also gets an insert button. */
export function InsertLineRow({ lineNumber, editing }: InsertLineButtonProps) {
  return (
    <li className="relative h-0">
      <InsertLineButton lineNumber={lineNumber} editing={editing} />
    </li>
  );
}
