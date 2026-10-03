import { useEffect, useMemo, useState } from "react";
import { normalizeTextQuery } from "../../script/textSearch";

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
  /** Search only the readable text of `Text` / `RawText` lines (the [T] toggle). */
  textOnly: boolean;
  onTextOnlyChange: (textOnly: boolean) => void;
  onSelect: (relativePath: string, lineNumber: number) => void;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/** The search box for the Scripts panel; the state of the search feeds `ScriptSearchResults`. */
export function useScriptSearch(directory: string | null, query: string, textOnly: boolean): SearchState {
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const trimmed = textOnly ? normalizeTextQuery(query) : query.trim();

  useEffect(() => {
    if (directory === null || trimmed.length < MIN_QUERY_LENGTH) {
      setState({ kind: "idle" });
      return;
    }
    let current = true;
    const timer = setTimeout(() => {
      setState({ kind: "searching" });
      window.electron
        .searchScripts(directory, trimmed, textOnly)
        .then((result) => current && setState({ kind: "done", ...result }))
        .catch((reason: unknown) => current && setState({ kind: "error", message: String(reason) }));
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [directory, trimmed, textOnly]);

  return state;
}

export function ScriptSearchInput({
  query,
  onQueryChange,
  textOnly,
  onTextOnlyChange,
}: Pick<ScriptSearchProps, "query" | "onQueryChange" | "textOnly" | "onTextOnlyChange">) {
  return (
    <div className="flex gap-1">
      <div className="relative min-w-0 flex-1">
        <input
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 py-0 pl-1 pr-6 text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
          placeholder={textOnly ? "Search dialogue text" : "Search in files"}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          spellCheck={false}
          title={
            textOnly
              ? `Find Text("...") and RawText("...") lines whose readable text contains this, ignoring style tags and line breaks (at least ${MIN_QUERY_LENGTH} characters)`
              : `Find lines containing this text in every script (at least ${MIN_QUERY_LENGTH} characters)`
          }
        />
        <button
          type="button"
          className={`absolute right-0.5 top-1/2 -translate-y-1/2 rounded px-1 font-mono text-xs leading-4 ${
            textOnly
              ? "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
              : "text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          }`}
          onClick={() => onTextOnlyChange(!textOnly)}
          aria-pressed={textOnly}
          aria-label="Search only the text of Text and RawText lines"
          title={
            textOnly
              ? "Searching only the readable text of Text/RawText lines; click to search whole lines"
              : "Search only the readable text of Text/RawText lines, ignoring style tags and line breaks"
          }
        >
          T
        </button>
      </div>
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
  textOnly: boolean;
  onSelect: (relativePath: string, lineNumber: number) => void;
};

/** Search hits grouped by file; clicking one opens that script at that line. */
export function ScriptSearchResults({ state, query, textOnly, onSelect }: ScriptSearchResultsProps) {
  // In a text-only search the hit text is the readable text, so the query is matched in the same shape
  const needle = textOnly ? normalizeTextQuery(query) : query.trim();
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
                <Highlighted text={hit.text} query={needle} />
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
