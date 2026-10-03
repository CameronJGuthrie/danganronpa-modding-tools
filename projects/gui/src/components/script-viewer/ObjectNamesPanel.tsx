import type { ObjectNames } from "../../script/objectNames";

type ObjectNamesPanelProps = {
  /** Names declared in the script's `Meta()` block. */
  names: ObjectNames;
  /** Object id -> number of `OnObject` / `ObjectState` references in the body. */
  uses: ReadonlyMap<number, number>;
};

/**
 * The per-script object names. Every id the body refers to gets a row whether or not it is named,
 * and named ids that are never referenced are listed too.
 */
export function ObjectNamesPanel({ names, uses }: ObjectNamesPanelProps) {
  const ids = [...new Set([...names.keys(), ...uses.keys()])].sort((a, b) => a - b);

  return (
    <section className="flex flex-col gap-1 border-t border-slate-200 dark:border-slate-600 pt-2">
      <header className="flex items-baseline gap-2 px-1">
        <h3 className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Objects</h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {names.size} named · {ids.length} total
        </span>
      </header>
      {ids.length === 0 && (
        <p className="px-1 text-xs text-slate-500 dark:text-slate-400">No objects in this script.</p>
      )}
      <ul className="flex flex-col">
        {ids.map((id) => {
          const count = uses.get(id) ?? 0;
          const name = names.get(id);
          return (
            <li
              key={id}
              className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <span className="w-8 shrink-0 text-right font-mono text-sm text-slate-500 dark:text-slate-400">{id}</span>
              <span
                className={`min-w-0 flex-1 truncate font-mono text-sm ${name === undefined ? "text-slate-400 dark:text-slate-500 italic" : ""}`}
              >
                {name ?? "unnamed"}
              </span>
              <span
                className={`w-12 shrink-0 text-right text-xs ${count === 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}
                title={
                  count === 0
                    ? "Named but never referenced in the body"
                    : `${count} reference${count === 1 ? "" : "s"} in the body`
                }
              >
                {count === 0 ? "unused" : `×${count}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
