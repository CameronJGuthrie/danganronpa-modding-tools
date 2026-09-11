import {
  Bool,
  Character,
  comparisonOperators,
  FlagGroup,
  LogicalJoin,
  UiVisibility,
  UserInterface,
} from "linscript-definitions";
import { useCallback, useMemo, useState } from "react";
import {
  buildControlFlow,
  type FlowItem,
  type FlowNode,
  type FlowNodeKind,
  firstNumber,
  parseScriptLines,
  type ScriptLine,
} from "../script/controlFlow";
import { e00_002_000 } from "../script/e00_002_000";
import { replaceLine } from "../script/editSource";
import { lineComment } from "../script/lineComment";

const SCRIPT_NAME = "e00_002_000";

const kindStyles: Record<FlowNodeKind, { badge: string; label: string }> = {
  script: { badge: "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900", label: "Script" },
  block: { badge: "bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100", label: "Block" },
  handlerGroup: { badge: "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100", label: "Handlers" },
  handler: { badge: "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100", label: "Handler" },
  menu: { badge: "bg-violet-200 dark:bg-violet-800 text-violet-900 dark:text-violet-100", label: "Menu" },
  option: { badge: "bg-violet-100 dark:bg-violet-900 text-violet-900 dark:text-violet-100", label: "Option" },
};

/** A numeric enum object whose member names may stand in for an argument. */
type NamedValues = Readonly<Record<string, string | number>>;

/** A name table chosen by the value of a nearby argument (`argument` is relative, -1 is the previous one). */
type DependentValues = { argument: number; tables: Readonly<Record<number, NamedValues>> };

type ArgumentSource = NamedValues | DependentValues | undefined;

/** Per-position sources; `tail` repeats after `head` for instructions with a variable argument count. */
type EditableArguments = { head: readonly ArgumentSource[]; tail?: readonly ArgumentSource[] };

/** After a character flag group the offset is a character id; after other groups it is a plain number. */
const characterOffset: DependentValues = {
  argument: -1,
  tables: { [FlagGroup.CharacterInvestigated]: Character, [FlagGroup.CharacterDead]: Character },
};

/**
 * Instructions whose arguments can be picked from a dropdown. Mirrors the named parameters the
 * compiler knows about.
 */
const editableArguments: Readonly<Record<string, EditableArguments>> = {
  Speaker: { head: [Character] },
  SetUI: { head: [UserInterface, UiVisibility] },
  SetFlag: { head: [FlagGroup, characterOffset, Bool] },
  IfFlag: {
    head: [FlagGroup, characterOffset, comparisonOperators, Bool],
    tail: [LogicalJoin, FlagGroup, characterOffset, comparisonOperators, Bool],
  },
  If: {
    head: [undefined, comparisonOperators, undefined],
    tail: [LogicalJoin, undefined, comparisonOperators, undefined],
  },
  IfFreeTimeEvent: { head: [undefined, comparisonOperators, undefined] },
  IfRelationship: { head: [undefined, comparisonOperators, undefined] },
};

function isDependent(source: ArgumentSource): source is DependentValues {
  return source !== undefined && "tables" in source;
}

/** The source for argument `index`, repeating the tail pattern for variable-length instructions. */
function sourceAt(spec: EditableArguments, index: number): ArgumentSource {
  if (index < spec.head.length) {
    return spec.head[index];
  }
  const tail = spec.tail ?? [];
  return tail.length === 0 ? undefined : tail[(index - spec.head.length) % tail.length];
}

/** The concrete name table for argument `index`, following one level of dependency. */
function tableAt(spec: EditableArguments, args: readonly string[], index: number): NamedValues | undefined {
  const source = sourceAt(spec, index);
  if (!isDependent(source)) {
    return source;
  }
  const controllingIndex = index + source.argument;
  const controllingTable = sourceAt(spec, controllingIndex);
  const controlling = numericValue(
    args[controllingIndex] ?? "",
    isDependent(controllingTable) ? undefined : controllingTable,
  );
  return controlling === undefined ? undefined : source.tables[controlling];
}

/** Canonical member names of a table, in declaration order; reverse-mapping keys and aliases are skipped. */
function enumNames(values: NamedValues): string[] {
  return Object.keys(values).filter((key) => Number.isNaN(Number(key)) && values[values[key] as number] === key);
}

/** The numeric value of a source argument that is either a number or a name in `values`. */
function numericValue(arg: string, values: NamedValues | undefined): number | undefined {
  if (values !== undefined && typeof values[arg] === "number") {
    return values[arg] as number;
  }
  const n = Number(arg);
  return arg.trim() !== "" && !Number.isNaN(n) ? n : undefined;
}

export function ScriptBrowser() {
  const [source, setSource] = useState(e00_002_000);
  // Node ids are assigned in source order, so an in-place line edit keeps the same tree and selection
  const flow = useMemo(() => buildControlFlow(source, SCRIPT_NAME), [source]);
  const [selectedId, setSelectedId] = useState<string>(flow.root.id);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  // "View All" shows every line of the script, indented, instead of one node's actions
  const [viewAll, setViewAll] = useState(false);
  const allLines = useMemo(() => (viewAll ? parseScriptLines(source) : []), [viewAll, source]);

  const selected = flow.nodesById.get(selectedId) ?? flow.root;

  const selectNode = useCallback((id: string) => {
    setViewAll(false);
    setSelectedId(id);
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const jumpToLabel = useCallback(
    (label: number) => {
      const ownerId = flow.labelOwners.get(label);
      if (ownerId) {
        setViewAll(false);
        setSelectedId(ownerId);
      }
    },
    [flow],
  );

  const editLine = useCallback((lineNumber: number, text: string) => {
    setSource((previous) => replaceLine(previous, lineNumber, text));
  }, []);

  return (
    <div className="flex gap-4 bg-slate-100 dark:bg-slate-900 p-4 h-[calc(100vh-9rem)] min-h-0">
      <aside className="w-96 shrink-0 overflow-auto rounded bg-white dark:bg-slate-800 p-2 shadow-sm">
        <FlowTree
          node={flow.root}
          depth={0}
          selectedId={viewAll ? null : selected.id}
          collapsed={collapsed}
          onSelect={selectNode}
          onToggle={toggleCollapsed}
          viewAll={viewAll}
          onViewAll={() => setViewAll(true)}
        />
      </aside>
      <section className="flex-1 min-w-0 overflow-auto rounded bg-white dark:bg-slate-800 p-4 shadow-sm">
        {viewAll ? (
          <AllLines
            title={flow.root.title}
            lines={allLines}
            labelOwners={flow.labelOwners}
            onSelect={selectNode}
            onJump={jumpToLabel}
            onEditLine={editLine}
          />
        ) : (
          <NodeDetails
            node={selected}
            labelOwners={flow.labelOwners}
            onSelect={selectNode}
            onJump={jumpToLabel}
            onEditLine={editLine}
          />
        )}
      </section>
    </div>
  );
}

type FlowTreeProps = {
  node: FlowNode;
  depth: number;
  /** Null while "View All" is active so no node reads as selected. */
  selectedId: string | null;
  collapsed: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  viewAll?: boolean;
  onViewAll?: () => void;
};

function FlowTree({ node, depth, selectedId, collapsed, onSelect, onToggle, viewAll, onViewAll }: FlowTreeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsed.has(node.id);
  const isSelected = node.id === selectedId || (node.kind === "script" && viewAll === true);
  const style = kindStyles[node.kind];

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded pr-2 ${isSelected ? "bg-blue-200 dark:bg-blue-900" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
        style={{ paddingLeft: `${depth * 0.75}rem` }}
      >
        <button
          type="button"
          className="w-5 shrink-0 text-slate-500 dark:text-slate-400"
          onClick={() => onToggle(node.id)}
          disabled={!hasChildren}
          aria-label={isCollapsed ? "Expand" : "Collapse"}
        >
          {hasChildren ? (isCollapsed ? "▸" : "▾") : ""}
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-baseline gap-2 py-1 text-left"
          onClick={() => onSelect(node.id)}
        >
          <span className={`shrink-0 rounded px-1 text-[10px] font-semibold uppercase ${style.badge}`}>
            {style.label}
          </span>
          <span className="shrink-0 font-mono text-sm">{node.title}</span>
          {node.subtitle && (
            <span className="truncate text-xs text-slate-500 dark:text-slate-400">{node.subtitle}</span>
          )}
        </button>
        {node.kind === "script" && onViewAll && (
          <button
            type="button"
            className={`ml-auto shrink-0 rounded px-1.5 text-xs ${viewAll ? "bg-blue-500 text-white" : "bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"}`}
            onClick={onViewAll}
            title="Show every line of the script with indentation"
          >
            View All
          </button>
        )}
      </div>
      {hasChildren && !isCollapsed && (
        <div>
          {node.children.map((child) => (
            <FlowTree
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              collapsed={collapsed}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type AllLinesProps = {
  title: string;
  lines: readonly ScriptLine[];
  labelOwners: Map<number, string>;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
  onEditLine: (lineNumber: number, text: string) => void;
};

/** Every line of the script in source order, indented by its block depth. */
function AllLines({ title, lines, labelOwners, onSelect, onJump, onEditLine }: AllLinesProps) {
  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${kindStyles.script.badge}`}>
            {kindStyles.script.label}
          </span>
          <h2 className="font-mono text-lg">{title}</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">all lines</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{lines.length} actions</p>
      </header>
      <ol className="flex flex-col font-mono text-sm">
        {lines.map((line) => (
          <ActionRow
            key={`line-${line.lineNumber}`}
            item={{ kind: "line", line }}
            indent={line.depth}
            labelOwners={labelOwners}
            onSelect={onSelect}
            onJump={onJump}
            onEditLine={onEditLine}
          />
        ))}
      </ol>
    </div>
  );
}

type NodeDetailsProps = {
  node: FlowNode;
  labelOwners: Map<number, string>;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
  onEditLine: (lineNumber: number, text: string) => void;
};

function NodeDetails({ node, labelOwners, onSelect, onJump, onEditLine }: NodeDetailsProps) {
  const style = kindStyles[node.kind];
  const lineCount = node.items.filter((item) => item.kind === "line").length;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <h2 className="font-mono text-lg">{node.title}</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Lines {node.startLine}–{node.endLine} · {lineCount} action{lineCount === 1 ? "" : "s"}
          {node.children.length > 0 && ` · ${node.children.length} nested`}
        </p>
      </header>

      {node.items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No actions.</p>
      ) : (
        <ol className="flex flex-col font-mono text-sm">
          {node.items.map((item) => (
            <ActionRow
              key={itemKey(item)}
              item={item}
              labelOwners={labelOwners}
              onSelect={onSelect}
              onJump={onJump}
              onEditLine={onEditLine}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function itemKey(item: FlowItem): string {
  return item.kind === "line" ? `line-${item.line.lineNumber}` : item.node.id;
}

type ActionRowProps = {
  item: FlowItem;
  /** Extra indentation levels, used by the all-lines view to reproduce the source layout. */
  indent?: number;
  labelOwners: Map<number, string>;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
  onEditLine: (lineNumber: number, text: string) => void;
};

function ActionRow({ item, indent = 0, labelOwners, onSelect, onJump, onEditLine }: ActionRowProps) {
  if (item.kind === "node") {
    const child = item.node;
    const style = kindStyles[child.kind];
    return (
      <li className="flex items-baseline gap-2 border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 px-2 py-1">
        <span className="w-10 shrink-0 text-right text-slate-400 dark:text-slate-500">{child.startLine}</span>
        <button
          type="button"
          className="flex items-baseline gap-2 text-left hover:underline"
          onClick={() => onSelect(child.id)}
        >
          <span className={`rounded px-1 text-[10px] font-semibold uppercase ${style.badge}`}>{style.label}</span>
          <span>{child.title}</span>
          {child.subtitle && <span className="text-xs text-slate-500 dark:text-slate-400">{child.subtitle}</span>}
        </button>
      </li>
    );
  }

  const { line } = item;
  const editable = editableArguments[line.functionName];
  const comment = lineComment(line);
  const isLabel = line.functionName === "Label";
  const isGoto = line.functionName === "Goto";
  const isBranch = line.functionName === "Then" || line.functionName === "IfFlag";
  const target = isGoto ? firstNumber(line) : undefined;
  const canJump = target !== undefined && labelOwners.has(target);

  let rowClass = "hover:bg-slate-50 dark:hover:bg-slate-700";
  if (isLabel) {
    rowClass = "bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200";
  } else if (isGoto) {
    rowClass = "bg-sky-50 dark:bg-sky-950 text-sky-900 dark:text-sky-200";
  } else if (isBranch) {
    rowClass = "bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-200";
  }

  return (
    <li className={`flex items-baseline gap-2 px-2 py-0.5 ${rowClass}`}>
      <span className="w-10 shrink-0 text-right text-slate-400 dark:text-slate-500">{line.lineNumber}</span>
      {indent > 0 && <span className="shrink-0" style={{ width: `${indent * 1.5}rem` }} />}
      {editable ? (
        <ArgumentEditor line={line} spec={editable} onEditLine={onEditLine} />
      ) : (
        <span className="whitespace-pre-wrap break-all">{line.text}</span>
      )}
      {comment !== undefined && (
        <span className="shrink-0 pl-2 text-slate-400 dark:text-slate-500 italic"># {comment}</span>
      )}
      {isGoto && (
        <button
          type="button"
          className="ml-auto shrink-0 rounded bg-sky-200 dark:bg-sky-800 px-1.5 text-xs disabled:opacity-40"
          disabled={!canJump}
          onClick={() => target !== undefined && onJump(target)}
          title={canJump ? `Go to Label(${target})` : "Label not found in this script"}
        >
          jump →
        </button>
      )}
    </li>
  );
}

type ArgumentEditorProps = {
  line: ScriptLine;
  spec: EditableArguments;
  onEditLine: (lineNumber: number, text: string) => void;
};

/**
 * Renders an instruction with each named argument as a dropdown; choosing a value rewrites the
 * line. Arguments without a table, and values the table has no name for, are shown as-is.
 */
function ArgumentEditor({ line, spec, onEditLine }: ArgumentEditorProps) {
  const setArgument = (index: number, value: string) => {
    const args = line.args.map((arg, i) => {
      if (i === index) {
        return value;
      }
      // An argument whose names depend on the one being changed keeps its number, not a name that
      // may no longer apply (e.g. a character name after switching to a non-character flag group)
      const source = sourceAt(spec, i);
      if (isDependent(source) && i + source.argument === index) {
        return String(numericValue(arg, tableAt(spec, line.args, i)) ?? arg);
      }
      return arg;
    });
    onEditLine(line.lineNumber, `${line.functionName}(${args.join(", ")})`);
  };

  return (
    <span className="flex items-baseline">
      <span>{line.functionName}(</span>
      {line.args.map((arg, index) => {
        const values = tableAt(spec, line.args, index);
        const key = `${line.lineNumber}-${index}`;
        return (
          <span key={key} className="flex items-baseline">
            {index > 0 && <span className="pr-1">,</span>}
            {values ? (
              <NamedArgumentSelect value={arg} values={values} onChange={(next) => setArgument(index, next)} />
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
  value: string;
  values: NamedValues;
  onChange: (value: string) => void;
};

function NamedArgumentSelect({ value, values, onChange }: NamedArgumentSelectProps) {
  const names = enumNames(values);
  const current = resolveName(values, value) ?? value;
  const known = names.includes(current);

  return (
    <select
      className="cursor-pointer rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-1 font-mono text-sm text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
      value={current}
      onChange={(event) => event.target.value !== "" && onChange(event.target.value)}
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
}

/** The enum member name for a source argument, which may already be a name or still a number. */
function resolveName(values: NamedValues, arg: string): string | undefined {
  if (Number.isNaN(Number(arg))) {
    return typeof values[arg] === "number" ? arg : undefined;
  }
  const name = values[Number(arg)];
  return typeof name === "string" ? name : undefined;
}
