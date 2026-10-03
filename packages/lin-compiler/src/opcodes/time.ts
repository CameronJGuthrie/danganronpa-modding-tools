import { Arithmetic, TimeOfDay, Variable } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, ParameterType, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { decodeValue, encodeValue, splitArgs } from "../parameter.ts";

/**
 * `Time(Night)` is source-only sugar for `SetVariable(Time, Assign, value)`, which sets the time of
 * day shown for the scene. Like `Wait` it is not a binary opcode: the reader expands it and the
 * writer collapses every assignment of a known `TimeOfDay` value back into it. The game only ever
 * assigns the variable (342 of 342 uses), so other arithmetic modes, and values without a name,
 * stay as plain `SetVariable`.
 */

/** Source name of the sugar. */
export const TIME = "Time";

const HEAD = [Variable.Time, Arithmetic.Assign];

/** True for a SetVariable entry that assigns a named TimeOfDay to the Time variable. */
export function isTime(entry: ScriptEntry): boolean {
  return (
    entry.opcode === Opcode.SetVariable &&
    entry.args.length === 4 &&
    entry.args[0] === HEAD[0] &&
    entry.args[1] === HEAD[1] &&
    nameOfValue(TimeOfDay, decodeValue(ParameterType.UInt16BE, entry.args, 2)) !== undefined
  );
}

/** The time-of-day name of a Time entry, as source argument text. */
export function formatTime(entry: ScriptEntry): string {
  return nameOfValue(TimeOfDay, decodeValue(ParameterType.UInt16BE, entry.args, 2)) as string;
}

/** Compile `Time(Name)` into its SetVariable entry. */
export function expandTime(argsText: string, line: number): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== 1) {
    throw new SourceError(line, `${TIME} expects 1 argument (time of day), got ${values.length}`);
  }
  const value = valueOfName(TimeOfDay, values[0]);
  if (value === undefined) {
    throw new SourceError(line, `unknown time of day '${values[0]}' for ${TIME}`);
  }
  return {
    opcode: Opcode.SetVariable,
    args: [
      ...HEAD.flatMap((head) => encodeValue(ParameterType.Byte, head)),
      ...encodeValue(ParameterType.UInt16BE, value),
    ],
  };
}
