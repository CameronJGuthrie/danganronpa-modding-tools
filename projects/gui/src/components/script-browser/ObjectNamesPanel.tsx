import { type KeyboardEvent, useState } from "react";
import { isValidObjectName, MAX_OBJECT_ID, type ObjectNames } from "../../script/objectNames";

type ObjectNamesPanelProps = {
  /** Names declared in the script's `Meta()` block. */
  names: ObjectNames;
  /** Object id -> number of `OnObject` / `ObjectState` references in the body. */
  uses: ReadonlyMap<number, number>;
  readOnly: boolean;
  /** Set (or, with an empty name, clear) the name of one object id. */
  onRename: (id: number, name: string) => void;
};

/**
 * Editor for the per-script object names. Every id the body refers to gets a row whether or not it
 * is named yet, named ids that are never referenced are listed too, and new ids can be added at the
 * bottom. Edits rewrite the `Meta()` block and rename the body's references.
 */
export function ObjectNamesPanel({ names, uses, readOnly, onRename }: ObjectNamesPanelProps) {
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
        {ids.map((id) => (
          <ObjectRow
            key={id}
            id={id}
            name={names.get(id) ?? ""}
            uses={uses.get(id) ?? 0}
            takenNames={names}
            readOnly={readOnly}
            onRename={onRename}
          />
        ))}
      </ul>
      {!readOnly && <AddObjectRow names={names} onAdd={onRename} />}
    </section>
  );
}

type ObjectRowProps = {
  id: number;
  name: string;
  uses: number;
  takenNames: ObjectNames;
  readOnly: boolean;
  onRename: (id: number, name: string) => void;
};

function ObjectRow({ id, name, uses, takenNames, readOnly, onRename }: ObjectRowProps) {
  const [draft, setDraft] = useState(name);
  // Re-sync the draft when the source changes underneath (another row, or an inline line edit)
  const [seen, setSeen] = useState(name);
  if (seen !== name) {
    setSeen(name);
    setDraft(name);
  }

  const trimmed = draft.trim();
  const problem = nameProblem(trimmed, id, takenNames);

  const commit = () => {
    if (trimmed === name || problem !== undefined) {
      setDraft(name);
      return;
    }
    onRename(id, trimmed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      setDraft(name);
      event.currentTarget.blur();
    }
  };

  return (
    <li className="flex items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700">
      <span className="w-8 shrink-0 text-right font-mono text-sm text-slate-500 dark:text-slate-400">{id}</span>
      <input
        className={`min-w-0 flex-1 rounded border bg-white dark:bg-slate-900 px-1 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 disabled:opacity-60 ${
          problem === undefined ? "border-slate-300 dark:border-slate-600" : "border-red-500"
        }`}
        value={draft}
        placeholder="unnamed"
        disabled={readOnly}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        title={problem ?? `Name for object ${id}; Enter saves, Esc reverts`}
      />
      <span
        className={`w-12 shrink-0 text-right text-xs ${uses === 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}
        title={
          uses === 0
            ? "Named but never referenced in the body"
            : `${uses} reference${uses === 1 ? "" : "s"} in the body`
        }
      >
        {uses === 0 ? "unused" : `×${uses}`}
      </span>
      <button
        type="button"
        className="w-4 shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-0 dark:text-slate-500 dark:hover:text-red-400"
        disabled={readOnly || name === ""}
        onClick={() => onRename(id, "")}
        title={`Remove the name of object ${id}`}
        aria-label={`Remove the name of object ${id}`}
      >
        ×
      </button>
    </li>
  );
}

type AddObjectRowProps = {
  names: ObjectNames;
  onAdd: (id: number, name: string) => void;
};

/** Names an id that the body does not reference yet, e.g. before writing its handler. */
function AddObjectRow({ names, onAdd }: AddObjectRowProps) {
  const [idText, setIdText] = useState("");
  const [name, setName] = useState("");

  const id = /^\d+$/.test(idText.trim()) ? Number(idText.trim()) : undefined;
  const idProblem =
    idText.trim() === ""
      ? "Enter an object id"
      : id === undefined || id > MAX_OBJECT_ID
        ? `Object id must be a number from 0 to ${MAX_OBJECT_ID}`
        : names.has(id)
          ? `Object ${id} is already named ${names.get(id)}`
          : undefined;
  const problem =
    idProblem ?? nameProblem(name.trim(), id ?? -1, names) ?? (name.trim() === "" ? "Enter a name" : undefined);

  const add = () => {
    if (problem !== undefined || id === undefined) {
      return;
    }
    onAdd(id, name.trim());
    setIdText("");
    setName("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      add();
    }
  };

  const fieldClass =
    "min-w-0 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700";

  return (
    <div className="flex items-center gap-2 px-1 pt-1">
      <input
        className={`${fieldClass} w-10 text-right`}
        value={idText}
        placeholder="id"
        inputMode="numeric"
        onChange={(event) => setIdText(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label="New object id"
      />
      <input
        className={`${fieldClass} flex-1`}
        value={name}
        placeholder="Name"
        spellCheck={false}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={onKeyDown}
        aria-label="New object name"
      />
      <button
        type="button"
        className="shrink-0 rounded bg-slate-200 px-1.5 text-xs hover:bg-slate-300 disabled:opacity-40 dark:bg-slate-600 dark:hover:bg-slate-500"
        disabled={problem !== undefined}
        onClick={add}
        title={problem ?? "Add this object name"}
      >
        Add
      </button>
    </div>
  );
}

/** Why `name` cannot be given to object `id`, or undefined when it can. Empty clears the name. */
function nameProblem(name: string, id: number, names: ObjectNames): string | undefined {
  if (name === "") {
    return undefined;
  }
  if (!isValidObjectName(name)) {
    return "Names are identifiers: letters, digits and underscores, not starting with a digit";
  }
  for (const [otherId, otherName] of names) {
    if (otherName === name && otherId !== id) {
      return `${name} already names object ${otherId}`;
    }
  }
  return undefined;
}
