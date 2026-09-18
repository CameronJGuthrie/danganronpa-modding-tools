type ActionPanelProps = {
  readOnly: boolean;
  onToggleReadOnly: () => void;
};

export function ActionPanel({ readOnly, onToggleReadOnly }: ActionPanelProps) {
  return (
    <div className="absolute top-2 right-6 z-10 flex gap-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white/90 dark:bg-slate-700/90 p-1 shadow backdrop-blur">
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
