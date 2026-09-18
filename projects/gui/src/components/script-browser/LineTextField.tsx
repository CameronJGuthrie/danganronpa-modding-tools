import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { ScriptLine } from "../../script/controlFlow";
import type { AfterSave, LineEditing } from "./LineEditing";

type LineTextFieldProps = {
  line: ScriptLine;
  editing: LineEditing;
};

/**
 * The inline text field for a row. Enter saves; Ctrl+Enter saves and opens the next line;
 * Alt+Enter saves and opens a new empty line below; Escape discards. Leaving the field saves too.
 */
export function LineTextField({ line, editing }: LineTextFieldProps) {
  const [text, setText] = useState(line.text);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards against the blur that fires while a keyboard save is already moving focus elsewhere
  const done = useRef(false);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, []);

  const finish = (then: AfterSave) => {
    if (done.current) {
      return;
    }
    done.current = true;
    editing.onSaveLine(line.lineNumber, text.trim(), then);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      done.current = true;
      editing.onCancelEdit();
    } else if (event.key === "Enter") {
      event.preventDefault();
      finish(event.altKey ? "insertBelow" : event.ctrlKey || event.metaKey ? "editNext" : "stop");
    }
  };

  return (
    <input
      ref={inputRef}
      className="min-w-0 flex-1 rounded border border-blue-400 bg-white dark:bg-slate-900 px-1 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={() => finish("stop")}
      spellCheck={false}
      title="Enter saves · Ctrl+Enter saves and edits the next line · Alt+Enter saves and adds a line below · Esc cancels"
    />
  );
}
