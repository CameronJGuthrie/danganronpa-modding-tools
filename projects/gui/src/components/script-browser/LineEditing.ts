/** What to do once a line edit is saved. */
export type AfterSave = "stop" | "editNext" | "insertBelow";

/**
 * Line-editing callbacks shared by every view that renders script rows. Kept referentially stable
 * (see `ScriptBrowser`) so memoised rows only re-render when their own line changes; which line is
 * open for editing is passed to each row separately for the same reason.
 */
export type LineEditing = {
  readOnly: boolean;
  onEditLine: (lineNumber: number, text: string) => void;
  onStartEdit: (lineNumber: number) => void;
  onSaveLine: (lineNumber: number, text: string, then: AfterSave) => void;
  onCancelEdit: () => void;
  /** Insert a blank line so that it becomes `lineNumber`. */
  onInsertLine: (lineNumber: number) => void;
};
