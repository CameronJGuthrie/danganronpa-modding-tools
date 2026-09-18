import type { SaveStatus } from "./ScriptEditor";

type ActionPanelProps = {
  readOnly: boolean;
  onToggleReadOnly: () => void;
  /** True when the source differs from what was last loaded or saved. */
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  /** Outcome of the last save: a few words beside the buttons, the paths in the tooltip. */
  status?: SaveStatus;
  /** True when the editor holds the saved mod copy rather than the original script. */
  fromMod?: boolean;
};

export function ActionPanel({ readOnly, onToggleReadOnly, dirty, saving, onSave, status, fromMod }: ActionPanelProps) {
  return (
    <div className="absolute top-2 right-6 z-10 flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white/90 dark:bg-slate-700/90 p-1 shadow backdrop-blur">
      {fromMod && (
        <span
          className="whitespace-nowrap px-1 text-xs text-amber-700 dark:text-amber-300"
          title="This script has a saved copy in the mod directory, which is what you are editing"
        >
          ★ mod copy
        </span>
      )}
      {status && (
        <span
          className={`whitespace-nowrap px-1 text-xs ${
            status.kind === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
          }`}
          title={status.detail}
        >
          {status.text}
        </span>
      )}
      <button
        type="button"
        className="rounded bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-500"
        onClick={onSave}
        disabled={saving || (!dirty && status?.kind !== "error")}
        title="Save to the file and copy it into the mod directory (Ctrl+S)"
      >
        {saving ? "Saving…" : dirty ? "Save •" : "Save"}
      </button>
      <button
        type="button"
        className={`rounded px-2 py-0.5 text-xs font-semibold ${
          readOnly
            ? "bg-amber-300 text-amber-950 dark:bg-amber-500 dark:text-amber-950"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500"
        }`}
        onClick={onToggleReadOnly}
        aria-pressed={readOnly}
        title={
          readOnly ? "Editing is disabled; click to allow edits" : "Disable all dropdowns so nothing can be edited"
        }
      >
        {readOnly ? "🔒 readonly" : "readonly"}
      </button>
    </div>
  );
}
