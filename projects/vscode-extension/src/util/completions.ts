import { instructions } from "../instructions";
import type { LinscriptInstruction, ParameterMeta } from "../instructions/linscript-instruction";
import { argumentNames } from "./argument-names";
import { argumentIndexAt, findCallAt, lookupInstruction, resolveTable } from "./call-at";
import { type ScopedNames, scopedNamesFromDocument } from "./script-meta";
import { type ArgumentNames, getArgumentsFromFunctionLike, isInsideQuotes, stripBranchJump } from "./string-util";

/** One suggestion, independent of the editor API so the engine can be unit tested. */
export type Completion = {
  label: string;
  kind: "instruction" | "value";
  /** Shown beside the label: the signature of an instruction, the number a name stands for. */
  detail?: string;
  documentation?: string;
  /**
   * Text inserted in place of the word at the cursor; `$0` marks where the cursor lands. Absent
   * when the label is inserted as it is.
   */
  snippet?: string;
  /** Whether the editor should open the suggestion list again after inserting, for the first argument. */
  retrigger?: boolean;
};

/** Suggestions for one cursor position plus the span of the word they replace (line offsets). */
export type CompletionResult = {
  items: Completion[];
  replaceStart: number;
  replaceEnd: number;
};

/** Where in the source the cursor is; decides which list is offered. */
export type CompletionContext =
  | { kind: "none" }
  | { kind: "instruction" }
  | { kind: "argument"; instruction: LinscriptInstruction; callText: string; nameStart: number; argIndex: number };

const WORD_CHAR = /\w/;

/**
 * The completions for the cursor at `character` on `lineText`. At the start of a statement (a
 * blank line, a partly typed name such as `Mo`, or the name of an existing call) every instruction
 * is offered alphabetically. Inside a call's parentheses the names the argument's slot accepts are
 * offered: an enum (`Speaker(` lists the characters), a dependent table chosen by an earlier
 * argument (`SetFlag(System, ` lists the System flags) or the document's `Meta()` names
 * (`OnObject(` lists the declared objects). A branch condition also offers `Goto` for its jump, and
 * the trailing arguments of `Text("...", ` are instructions again. Nothing is offered inside a
 * string or after a `#` comment.
 */
export function completionsAt(
  lineText: string,
  character: number,
  document: string | ScopedNames,
  insideMeta = false,
): CompletionResult {
  const { replaceStart, replaceEnd } = wordAt(lineText, character);
  const context = contextAt(lineText, character);
  const items =
    context.kind === "instruction"
      ? instructionCompletions(lineText, replaceEnd, insideMeta)
      : context.kind === "argument"
        ? argumentCompletions(context, lineText, replaceStart, document)
        : [];
  return { items, replaceStart, replaceEnd };
}

/** Classify the cursor position; exported so a trigger character can be ignored where it means nothing. */
export function contextAt(lineText: string, character: number): CompletionContext {
  const before = lineText.slice(0, character);
  if (isInsideQuotes(lineText, character) || isAfterComment(lineText, character)) {
    return { kind: "none" };
  }
  const call = findCallAt(lineText, character);
  if (call === undefined) {
    // Outside every call: a statement may start here if only whitespace (or a word being typed) precedes
    return /^\s*[A-Za-z_]?\w*$/.test(before) ? { kind: "instruction" } : { kind: "none" };
  }
  const nameEnd = call.nameStart + call.name.length;
  if (character <= nameEnd) {
    return { kind: "instruction" };
  }
  const instruction = lookupInstruction(call.name);
  if (instruction === undefined) {
    return { kind: "none" };
  }
  const callText = lineText.slice(call.nameStart, call.end);
  const argIndex = argumentIndexAt(callText, character - call.nameStart);
  if (argIndex === undefined) {
    return { kind: "none" };
  }
  // The instructions written after a Text string are statements of their own
  if (instruction.name === "Text" && argIndex > 0) {
    return { kind: "instruction" };
  }
  return { kind: "argument", instruction, callText, nameStart: call.nameStart, argIndex };
}

function isAfterComment(lineText: string, character: number): boolean {
  for (let i = 0; i < character; i++) {
    if (lineText[i] === "#" && !isInsideQuotes(lineText, i)) {
      return true;
    }
  }
  return false;
}

/** The identifier span around `character`, empty at the cursor when no word is there. */
function wordAt(lineText: string, character: number): { replaceStart: number; replaceEnd: number } {
  let start = character;
  while (start > 0 && WORD_CHAR.test(lineText[start - 1])) {
    start--;
  }
  let end = character;
  while (end < lineText.length && WORD_CHAR.test(lineText[end])) {
    end++;
  }
  return { replaceStart: start, replaceEnd: end };
}

/** Whether the cursor at `offset` of `documentText` is below a `Meta()` line, i.e. inside the file's annotation block. */
export function isInsideMeta(documentText: string, offset: number): boolean {
  return /^\s*Meta\(\s*\)\s*$/m.test(documentText.slice(0, offset));
}

/** The entries a `Meta()` block may hold, mirroring `META_*` in lin-compiler's `opcodes/meta.ts`. */
const META_ENTRIES: ReadonlySet<string> = new Set(["Object", "Character", "Option", "LabelName", "SceneFlag"]);

/**
 * The instructions that may start a statement, alphabetically: inside the `Meta()` block only its
 * entries, outside it everything but those entries (with `Option` kept, as the menu-choice sugar).
 * The parentheses are inserted unless the word is already followed by one.
 */
function instructionCompletions(lineText: string, replaceEnd: number, insideMeta: boolean): Completion[] {
  const hasParens = /^\s*\(/.test(lineText.slice(replaceEnd));
  return Object.values(instructions)
    .filter((instruction) =>
      insideMeta
        ? META_ENTRIES.has(instruction.name)
        : instruction.name === "Option" || !META_ENTRIES.has(instruction.name),
    )
    .map((instruction) => instructionCompletion(instruction, hasParens))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
}

export function instructionCompletion(instruction: LinscriptInstruction, hasParens: boolean): Completion {
  const takesArguments = instruction.varargs || instruction.parameters.length > 0 || takesString(instruction);
  const firstNamed =
    (instruction.varargs ? instruction.varargNames?.head[0] : instruction.parameters[0]?.names) !== undefined ||
    instruction.parameters[0]?.namesBy !== undefined ||
    instruction.parameters[0]?.scope !== undefined;
  const snippet = hasParens
    ? undefined
    : !takesArguments
      ? `${instruction.name}()`
      : takesString(instruction)
        ? `${instruction.name}("$0")`
        : `${instruction.name}($0)`;
  return {
    label: instruction.name,
    kind: "instruction",
    detail: signature(instruction),
    documentation: instruction.description === undefined ? undefined : tidy(instruction.description),
    snippet,
    retrigger: snippet !== undefined && takesArguments && firstNamed,
  };
}

/** Instructions whose first argument is a quoted string. */
function takesString(instruction: LinscriptInstruction): boolean {
  return instruction.name === "Text" || instruction.name === "RawText";
}

/** The names the argument under the cursor accepts, alphabetically, plus `Goto` for a condition's jump. */
function argumentCompletions(
  context: Extract<CompletionContext, { kind: "argument" }>,
  lineText: string,
  replaceStart: number,
  document: string | ScopedNames,
): Completion[] {
  const { instruction, callText, nameStart, argIndex } = context;
  const scoped = typeof document === "string" ? scopedNamesFromDocument(document) : document;

  // The call may be unfinished, so the arguments before the cursor are read from a probe that
  // stands a 0 in for the word being typed and closes the parenthesis: `SetFlag(System, Ha` -> `SetFlag(System, 0)`
  const head = lineText.slice(nameStart, replaceStart);
  const probe = `${stripBranchJump(head.replace(/\)\s*$/, ""))}0)`;
  const names = argumentNames(instruction, probe, scoped);
  const args = getArgumentsFromFunctionLike(probe, names);
  const parameter: ParameterMeta | undefined = instruction.varargs ? undefined : instruction.parameters[argIndex];

  let table = resolveTable(names[argIndex], args, argIndex);
  if (instruction.name === "Option" && argIndex === 0) {
    table = scoped.Option;
  }

  const items = valueCompletions(table, parameter);
  if (instruction.branch && !isInsideJump(callText)) {
    items.push(instructionCompletion(instructions.Goto, false));
  }
  return items.sort((a, b) => a.label.localeCompare(b.label, "en"));
}

/** Whether the argument text already contains a nested Goto, in which case the jump is not offered again. */
function isInsideJump(callText: string): boolean {
  return /Goto\s*\(/.test(callText);
}

export function valueCompletions(table: ArgumentNames | undefined, parameter: ParameterMeta | undefined): Completion[] {
  if (table === undefined) {
    return [];
  }
  const items: Completion[] = [];
  for (const [name, value] of Object.entries(table)) {
    if (typeof value !== "number" || /^\d+$/.test(name)) {
      continue;
    }
    const entry = parameter?.values?.[value];
    const described = entry === undefined ? undefined : typeof entry === "string" ? entry : entry.name;
    const documentation = entry !== undefined && typeof entry !== "string" ? entry.description : undefined;
    items.push({
      label: name,
      kind: "value",
      detail: described !== undefined && described !== name ? `${value} · ${described}` : `${value}`,
      documentation: documentation === undefined ? undefined : tidy(documentation),
    });
  }
  return items;
}

function signature(instruction: LinscriptInstruction): string {
  if (instruction.varargs) {
    return `${instruction.name}(...)`;
  }
  if (takesString(instruction)) {
    return `${instruction.name}("...")`;
  }
  if (instruction.name === "Option") {
    return `${instruction.name}(id, "label")`;
  }
  const params = instruction.parameters.map((parameter, index) => {
    const label = parameter.name || `arg${index + 1}`;
    return parameter.defaultValue === undefined ? label : `${label}?`;
  });
  return `${instruction.name}(${params.join(", ")})`;
}

/** Collapse template-literal descriptions written over several indented lines into one paragraph. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}
