import { useEffect, useMemo, useState } from "react";

type Hit = { path: string; lineNumber: number; text: string };
type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "error"; message: string }
  | { kind: "done"; hits: Hit[]; fileCount: number; truncated: boolean };

type ScriptSearchProps = {
  directory: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (relativePath: string, lineNumber: number) => void;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/** The search box for the Scripts panel; the state of the search feeds `ScriptSearchResults`. */
export function useScriptSearch(directory: string | null, query: string): SearchState {
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const trimmed = query.trim();

  useEffect(() => {
    if (directory === null || trimmed.length < MIN_QUERY_LENGTH) {
      setState({ kind: "idle" });
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      setState({ kind: "searching" });
      window.electron
        .searchScripts(directory, trimmed)
        .then((result) => current && setState({ kind: "done", ...result }))
        .catch((reason: unknown) => current && setState({ kind: "error", message: String(reason) }));
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [directory, trimmed]);

  return state;
}

export function ScriptSearchInput({ query, onQueryChange }: Pick<ScriptSearchProps, "query" | "onQueryChange">) {
  return (
    <div className="flex gap-1">
      <input
        className="min-w-0 flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1 text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
        placeholder="Search in files"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        spellCheck={false}
        title={`Find lines containing this text in every script (at least ${MIN_QUERY_LENGTH} characters)`}
      />
      {query !== "" && (
        <button
          type="button"
          className="shrink-0 rounded bg-slate-200 px-1.5 text-xs hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
          onClick={() => onQueryChange("")}
          title="Clear the search"
          aria-label="Clear the search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

type ScriptSearchResultsProps = {
  state: SearchState;
  query: string;
  onSelect: (relativePath: string, lineNumber: number) => void;
};

/** Search hits grouped by file; clicking one opens that script at that line. */
export function ScriptSearchResults({ state, query, onSelect }: ScriptSearchResultsProps) {
  const groups = useMemo(() => {
    if (state.kind !== "done") {
      return [];
    }
    const byPath = new Map<string, Hit[]>();
    for (const hit of state.hits) {
      const list = byPath.get(hit.path);
      if (list) {
        list.push(hit);
      } else {
        byPath.set(hit.path, [hit]);
      }
    }
    return [...byPath.entries()];
  }, [state]);

  if (state.kind === "idle") {
    return (
      <p className="p-1 text-xs text-slate-500 dark:text-slate-400">
        Type at least {MIN_QUERY_LENGTH} characters to search.
      </p>
    );
  }
  if (state.kind === "searching") {
    return <p className="p-1 text-xs text-slate-500 dark:text-slate-400">Searching…</p>;
  }
  if (state.kind === "error") {
    return <p className="p-1 text-xs text-red-600 dark:text-red-400">{state.message}</p>;
  }

  return (
    <div className="flex flex-col">
      <p className="p-1 text-xs text-slate-500 dark:text-slate-400">
        {state.hits.length}
        {state.truncated ? "+" : ""} hit{state.hits.length === 1 ? "" : "s"} in {groups.length} of {state.fileCount}{" "}
        files{state.truncated ? " (showing the first matches only)" : ""}
      </p>
      {groups.map(([path, hits]) => (
        <div key={path} className="flex flex-col">
          <div
            className="sticky top-0 truncate bg-white px-1 py-0.5 text-xs font-semibold dark:bg-slate-800"
            title={path}
          >
            {path.replace(/\.linscript$/, "")}
            <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">{hits.length}</span>
          </div>
          {hits.map((hit) => (
            <button
              key={hit.lineNumber}
              type="button"
              className="flex w-full items-baseline gap-1 rounded px-1 py-0.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => onSelect(hit.path, hit.lineNumber)}
              title={hit.text}
            >
              <span className="w-8 shrink-0 text-right text-xs text-slate-400 dark:text-slate-500">
                {hit.lineNumber}
              </span>
              <span className="truncate text-xs">
                <Highlighted text={hit.text} query={query.trim()} />
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The line text with every case-insensitive occurrence of the query marked. */
function Highlighted({ text, query }: { text: string; query: string }) {
  if (query === "") {
    return <>{text}</>;
  }
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let from = 0;
  for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, from)) {
    parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="rounded-sm bg-amber-200 text-inherit dark:bg-amber-600/60">
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}
