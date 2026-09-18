import { memo, useCallback, useRef } from "react";
import type { ScriptLine } from "../../script/controlFlow";
import {
  type EditableArguments,
  enumNames,
  isDependent,
  type NamedValues,
  numericValue,
  resolveName,
  sourceAt,
  tableAt,
} from "./editableArguments";

type ArgumentEditorProps = {
  line: ScriptLine;
  spec: EditableArguments;
  readOnly: boolean;
  onEditLine: (lineNumber: number, text: string) => void;
};

/**
 * Renders an instruction with each named argument as a dropdown; choosing a value rewrites the
 * line. Arguments without a table, and values the table has no name for, are shown as-is.
 */
export function ArgumentEditor({ line, spec, readOnly, onEditLine }: ArgumentEditorProps) {
  // The dropdowns are memoised, so their change handler must stay stable yet always see the
  // current line (its number shifts whenever a line is inserted above it)
  const lineRef = useRef(line);
  lineRef.current = line;

  const setArgument = useCallback(
    (index: number, value: string) => {
      const current = lineRef.current;
      const args = current.args.map((arg, i) => {
        if (i === index) {
          return value;
        }
        // An argument whose names depend on the one being changed keeps its number, not a name that
        // may no longer apply (e.g. a character name after switching to a non-character flag group)
        const source = sourceAt(spec, i);
        if (isDependent(source) && i + source.argument === index) {
          return String(numericValue(arg, tableAt(spec, current.args, i)) ?? arg);
        }
        return arg;
      });
      onEditLine(current.lineNumber, `${current.functionName}(${args.join(", ")})`);
    },
    [spec, onEditLine],
  );

  return (
    <span className="flex items-baseline">
      <span>{line.functionName}(</span>
      {line.args.map((arg, index) => {
        const values = tableAt(spec, line.args, index);
        return (
          // Positional key: a line-number key would remount the dropdown whenever lines shift
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          <span key={index} className="flex items-baseline">
            {index > 0 && <span className="pr-1">,</span>}
            {values ? (
              <NamedArgumentSelect
                index={index}
                value={arg}
                values={values}
                disabled={readOnly}
                onChange={setArgument}
              />
            ) : (
              <span>{arg}</span>
            )}
          </span>
        );
      })}
      <span>)</span>
    </span>
  );
}

type NamedArgumentSelectProps = {
  /** Position of this argument, passed back to `onChange`. */
  index: number;
  value: string;
  values: NamedValues;
  disabled?: boolean;
  onChange: (index: number, value: string) => void;
};

/**
 * Memoised because a script has hundreds of these, each with dozens of options; skipping them
 * when nothing they show has changed is most of what keeps line insertion fast.
 */
const NamedArgumentSelect = memo(function NamedArgumentSelect({
  index,
  value,
  values,
  disabled = false,
  onChange,
}: NamedArgumentSelectProps) {
  const names = enumNames(values);
  const current = resolveName(values, value) ?? value;
  const known = names.includes(current);

  return (
    <select
      className="cursor-pointer rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-1 font-mono text-sm text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-inherit disabled:opacity-90"
      disabled={disabled}
      value={current}
      onChange={(event) => event.target.value !== "" && onChange(index, event.target.value)}
      title="Change value"
    >
      {!known && <option value={current}>{current || "?"}</option>}
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
});
