import type { LinscriptInstruction } from "../instructions/linscript-instruction";
import { argumentNames } from "./argument-names";
import type { ScopedNames } from "./script-meta";
import {
  argumentTable,
  getArgumentsFromFunctionLike,
  hasNamedValue,
  isNumericArgument,
  stripBranchJump,
  valueOfName,
} from "./string-util";

/**
 * One problem with a call, located by its offset within the call text. An `error` is something the
 * compiler rejects outright (a negative or non-numeric argument, the wrong argument count); a
 * `warning` is a value the compiler accepts but the tables do not recognise.
 */
export type ArgumentProblem = {
  stringIndex: number;
  length: number;
  message: string;
  severity: "error" | "warning";
};

/** The forms a source argument may take: a decimal number, a name, or a comparison or arithmetic symbol. */
const WELL_FORMED_ARGUMENT = /^(?:\d+|[A-Za-z_]\w*|[-+<>!=]=?)$/;
const NEGATIVE_NUMBER = /^-\s*\d+(?:\.\d+)?$/;
const JUMP_ARGUMENT = /^Goto\s*\(.*\)$/s;

/**
 * Check the shape of one call of `instruction` before its values are looked at: every argument must
 * be a decimal number, a name or an operator symbol (so `-1`, `1.5`, `0x10` and an empty argument
 * are errors), a condition must end with its `Goto(label)` jump, and a fixed-arity instruction must
 * be given between its required and total number of arguments. Instructions that take a quoted
 * string (`Text`, `RawText`, `Option`) are not checked here. `callText` is the whole call,
 * including its closing parenthesis.
 */
export function validateCallSyntax(instruction: LinscriptInstruction, callText: string): ArgumentProblem[] {
  const open = callText.indexOf("(");
  const close = callText.lastIndexOf(")");
  if (open === -1 || close < open) {
    return [];
  }
  const problems: ArgumentProblem[] = [];
  const report = (stringIndex: number, length: number, message: string) =>
    problems.push({ stringIndex, length: Math.max(length, 1), message, severity: "error" });

  const tokens = splitArguments(callText.slice(open + 1, close), open + 1);
  if (instruction.branch) {
    const jump = tokens.at(-1);
    if (jump !== undefined && JUMP_ARGUMENT.test(jump.text)) {
      tokens.pop();
    } else {
      report(close, 1, `${instruction.name} must end with its jump, Goto(label)`);
    }
  }

  for (const token of tokens) {
    if (WELL_FORMED_ARGUMENT.test(token.text)) {
      continue;
    }
    if (token.text.length === 0) {
      report(token.stringIndex, 1, `Empty argument in ${instruction.name}`);
    } else if (NEGATIVE_NUMBER.test(token.text)) {
      report(
        token.stringIndex,
        token.text.length,
        `Negative argument '${token.text}' in ${instruction.name}; values are unsigned`,
      );
    } else {
      report(token.stringIndex, token.text.length, `'${token.text}' is not a number or a name in ${instruction.name}`);
    }
  }

  if (!instruction.varargs) {
    const total = instruction.parameters.length;
    const required = instruction.parameters.filter((parameter) => parameter.defaultValue === undefined).length;
    if (tokens.length < required || tokens.length > total) {
      const expected = required === total ? `${total}` : `${required} to ${total}`;
      report(open, close - open + 1, `${instruction.name} expects ${expected} argument(s), got ${tokens.length}`);
    }
  }
  return problems;
}

/** Split an argument list on commas, keeping each trimmed argument's offset (`base` is the list's offset). */
function splitArguments(list: string, base: number): { text: string; stringIndex: number }[] {
  if (list.trim().length === 0) {
    return [];
  }
  const tokens: { text: string; stringIndex: number }[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i <= list.length; i++) {
    const char = list[i];
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    }
    if (i === list.length || (char === "," && depth === 0)) {
      const raw = list.slice(start, i);
      const leading = raw.length - raw.trimStart().length;
      tokens.push({ text: raw.trim(), stringIndex: base + start + leading });
      start = i + 1;
    }
  }
  return tokens;
}

/**
 * Check the values of every argument of one well-formed call of `instruction` (`callText`, e.g.
 * `Music(DanganRonpa, 101, 60)`; see `validateCallSyntax` for the shape).
 *
 * A name must be in the table that applies to its slot (an enum from `linscript-definitions`, a
 * dependent table chosen by an earlier argument, or the document's `Meta()` names), so
 * `Music(HappyBirthday, 100, 60)` is reported. A plain number is accepted unless its parameter
 * declares a `range` and the number is outside it without being one of the slot's named values, so
 * `Music(DanganRonpa, 101, 60)` is reported through the volume's 0–100 range while sprite ids and
 * other slots without a range stay unchecked. A range may depend on the other arguments:
 * `Music(Stop, 120, 0)` passes because the byte is a fade-out length when the track stops. Annotations such as `Object(20, Monitor)` declare
 * names rather than use them and are never checked.
 */
export function validateCall(
  instruction: LinscriptInstruction,
  callText: string,
  scoped: ScopedNames,
): ArgumentProblem[] {
  if (instruction.annotation) {
    return [];
  }
  // A condition's trailing Goto(label) is validated as its own Goto call
  const call = instruction.branch ? stripBranchJump(callText) : callText;
  const names = argumentNames(instruction, call, scoped);
  const args = getArgumentsFromFunctionLike(call, names);
  const values = args.map((arg) => arg.value);
  const problems: ArgumentProblem[] = [];

  args.forEach((arg, index) => {
    const table = argumentTable(names, index, args);
    const parameter = instruction.varargs ? undefined : instruction.parameters[index];
    const label = parameter?.name ?? `argument ${index + 1}`;
    const report = (message: string) =>
      problems.push({ stringIndex: arg.stringIndex, length: arg.text.length, message, severity: "warning" });

    if (!isNumericArgument(arg.text)) {
      if (valueOfName(table, arg.text) === undefined) {
        report(`Unknown ${label} '${arg.text}' in ${instruction.name}`);
      }
      return;
    }

    const range = typeof parameter?.range === "function" ? parameter.range(values) : parameter?.range;
    if (range === undefined) {
      return;
    }
    const value = Number(arg.text);
    if ((value < range.min || value > range.max) && !hasNamedValue(table, value)) {
      report(`${label} ${value} is outside the valid range ${range.min} to ${range.max} in ${instruction.name}`);
    }
  });

  return problems;
}
