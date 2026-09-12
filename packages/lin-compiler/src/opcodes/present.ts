import { Arithmetic, Present } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BinaryError, SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";

/**
 * `GivePresent(Name)` and `ReceivePresent(Name)` are source-only sugar for the binary `Present`
 * opcode, whose bytes are `(presentId, Arithmetic, quantity)`. The game only ever subtracts one
 * item (the player hands a gift over in the free-time menus) or adds one (a story reward), so the
 * sugar names the direction and fixes the quantity at 1. `Present` itself is a hidden opcode, not a
 * source instruction: bytes the sugar cannot express are an error rather than a raw fallback, and
 * a present id must be a known `Present` name.
 */

export const GIVE_PRESENT = "GivePresent";
export const RECEIVE_PRESENT = "ReceivePresent";

const QUANTITY = 1;

const OPERATION: Record<string, Arithmetic> = {
  [GIVE_PRESENT]: Arithmetic.Subtract,
  [RECEIVE_PRESENT]: Arithmetic.Add,
};

export type PresentSugarName = typeof GIVE_PRESENT | typeof RECEIVE_PRESENT;

export function isPresentSugarName(name: string): name is PresentSugarName {
  return Object.hasOwn(OPERATION, name);
}

/** True for a binary Present entry. Whether it can be written as sugar is decided by `formatPresent`. */
export function isPresent(entry: ScriptEntry): boolean {
  return entry.opcode === Opcode.Present;
}

/** The sugar name and argument text for a Present entry; throws when the bytes are not expressible. */
export function formatPresent(entry: ScriptEntry): { name: PresentSugarName; args: string } {
  if (entry.args.length !== 3) {
    throw new BinaryError(`Present expects 3 bytes, got ${entry.args.length}`);
  }
  const [id, operation, quantity] = entry.args;
  const name = operation === Arithmetic.Subtract ? GIVE_PRESENT : operation === Arithmetic.Add ? RECEIVE_PRESENT : undefined;
  if (name === undefined) {
    throw new BinaryError(`Present uses arithmetic mode ${operation}; only Add and Subtract are understood`);
  }
  if (quantity !== QUANTITY) {
    throw new BinaryError(`Present has quantity ${quantity}; only ${QUANTITY} is understood`);
  }
  const presentName = nameOfValue(Present, id);
  if (presentName === undefined) {
    throw new BinaryError(`unknown present id ${id}`);
  }
  return { name, args: presentName };
}

/** Compile `GivePresent(Name)` or `ReceivePresent(Name)` into its Present entry. */
export function expandPresent(name: PresentSugarName, argsText: string, line: number): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== 1) {
    throw new SourceError(line, `${name} expects 1 argument (present), got ${values.length}`);
  }
  const id = valueOfName(Present, values[0]);
  if (id === undefined) {
    throw new SourceError(line, `unknown present '${values[0]}' for ${name}`);
  }
  return { opcode: Opcode.Present, args: [id, OPERATION[name], QUANTITY] };
}
