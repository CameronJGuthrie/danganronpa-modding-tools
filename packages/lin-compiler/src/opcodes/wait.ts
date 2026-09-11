import { Arithmetic, Variable } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { ParameterType } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { decodeValue, encodeValue, parseArg, splitArgs } from "../parameter.ts";

/**
 * `Wait(frames)` is source-only sugar for `SetVariable(Wait, Assign, frames)`, which is how the
 * game pauses a script. Like the Text sugar it is not a binary opcode: the reader expands it and the
 * writer collapses every matching SetVariable back into it.
 */

/** Source name of the sugar. */
export const WAIT = "Wait";

const HEAD = [Variable.Wait, Arithmetic.Assign];

/** True for a SetVariable entry that assigns the Wait variable. */
export function isWait(entry: ScriptEntry): boolean {
  return (
    entry.opcode === Opcode.SetVariable &&
    entry.args.length === 4 &&
    entry.args[0] === HEAD[0] &&
    entry.args[1] === HEAD[1]
  );
}

/** The frame count of a Wait entry, as source argument text. */
export function formatWait(entry: ScriptEntry): string {
  return String(decodeValue(ParameterType.UInt16BE, entry.args, 2));
}

/** Compile `Wait(frames)` into its SetVariable entry. */
export function expandWait(argsText: string, line: number): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== 1) {
    throw new SourceError(line, `${WAIT} expects 1 argument (frames), got ${values.length}`);
  }
  return {
    opcode: Opcode.SetVariable,
    args: [
      ...HEAD.flatMap((value) => encodeValue(ParameterType.Byte, value)),
      ...parseArg(ParameterType.UInt16BE, values[0], line),
    ],
  };
}
