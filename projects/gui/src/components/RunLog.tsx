type RunLogProps = {
  result: { ok: boolean; output: string };
  onDismiss: () => void;
};

/** The build output of the last "Run game", floating below the header until dismissed. */
export function RunLog({ result, onDismiss }: RunLogProps) {
  return (
    <div
      className={`fixed top-20 right-8 z-20 flex max-h-[60vh] w-[36rem] max-w-[calc(100vw-4rem)] flex-col rounded-md border shadow-lg backdrop-blur ${
        result.ok
          ? "border-emerald-300 bg-emerald-50/95 dark:border-emerald-700 dark:bg-emerald-950/95"
          : "border-red-300 bg-red-50/95 dark:border-red-700 dark:bg-red-950/95"
      }`}
    >
      <header className="flex items-center gap-2 px-2 py-1 text-xs font-semibold">
        <span>{result.ok ? "Mods built, game launching" : "Run game failed"}</span>
        <button
          type="button"
          className="ml-auto rounded px-1.5 hover:bg-black/10 dark:hover:bg-white/10"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      </header>
      <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap px-2 pb-2 font-mono text-xs">
        {result.output.trim()}
      </pre>
    </div>
  );
}
