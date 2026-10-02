import { Opcode } from "../definitions/opcode.definition.ts";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BinaryError, SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";
import { formatArgs, parseEntry } from "./arguments.ts";
import { getOpcode, getOpcodeByName, type OpcodeInfo } from "./lookup.ts";

/**
 * A conditional branch. In the game every `If`, `IfFlag`, `IfRelationship` and `IfFreeTimeEvent`
 * is followed by exactly `Then` and then a `Goto`: the condition opcodes have no other body, and
 * `Then` never appears anywhere else (5853 of 5853 occurrences in the game's scripts). Source
 * therefore writes the three as one instruction whose last argument is the jump:
 *
 *     IfRelationship(Sayaka, >, 0,
 *         Goto(HatedGift))
 *
 * The form is mandatory rather than optional sugar, because the separate opcodes make no sense
 * on their own: `Then` is a hidden opcode that source cannot name, a condition without a trailing
 * `Goto(...)` is a source error, and a binary condition not followed by `Then` + `Goto` (or a
 * stray `Then`) is a decompile error rather than a raw fallback. The label may be a number or a
 * name declared with `LabelName(id, Name)` in the `Meta()` block, as for a plain `Goto`.
 */

/** Source name of the jump written as the condition's last argument. */
export const GOTO = "Goto";

const CONDITIONS: ReadonlySet<number> = new Set<number>([
  Opcode.If,
  Opcode.IfFlag,
  Opcode.IfRelationship,
  Opcode.IfFreeTimeEvent,
]);

const gotoOpcode = getOpcodeByName(GOTO) as OpcodeInfo;

/** Matches the trailing `Goto(label)` argument, capturing the label text. */
const GOTO_CALL = new RegExp(`^${GOTO}\\s*\\((.*)\\)$`);

/** True for a condition opcode, which source always writes with its branch. */
export function isCondition(opcode: OpcodeInfo): boolean {
  return CONDITIONS.has(opcode.id);
}

/** True for a binary condition entry. */
export function isConditionEntry(entry: ScriptEntry): boolean {
  return CONDITIONS.has(entry.opcode);
}

/** Compile `If*(conditions..., Goto(label))` into its condition, Then and Goto entries. */
export function expandBranch(opcode: OpcodeInfo, argsText: string, line: number, scopes: ScopeTables): ScriptEntry[] {
  const values = splitArgs(argsText);
  const jump = values.length === 0 ? undefined : GOTO_CALL.exec(values[values.length - 1]);
  if (jump === null || jump === undefined) {
    throw new SourceError(
      line,
      `${opcode.name} must end with its branch: ${opcode.name}(..., ${GOTO}(label)); there is no separate Then()`,
    );
  }
  return [
    parseEntry(opcode, values.slice(0, -1).join(", "), line, scopes),
    { opcode: Opcode.Then, args: [] },
    parseEntry(gotoOpcode, jump[1], line, scopes),
  ];
}

/**
 * Check that the condition at `index` is followed by `Then` and `Goto`, which the writer absorbs
 * into the condition's line; throws when the bytes do not have that shape.
 */
export function branchJump(entries: readonly ScriptEntry[], index: number): ScriptEntry {
  const name = getOpcode(entries[index].opcode)?.name ?? "condition";
  const then = entries[index + 1];
  const jump = entries[index + 2];
  if (then === undefined || then.opcode !== Opcode.Then || then.args.length !== 0) {
    throw new BinaryError(`${name} is not followed by Then; only If* + Then + Goto branches are understood`);
  }
  if (jump === undefined || jump.opcode !== Opcode.Goto) {
    throw new BinaryError(`${name}'s Then is not followed by Goto; only If* + Then + Goto branches are understood`);
  }
  return jump;
}

/**
 * The argument text of a branch: the condition's own arguments, and the `Goto(label)` call the
 * writer places on its own line after them.
 */
export function formatBranch(
  opcode: OpcodeInfo,
  entry: ScriptEntry,
  jump: ScriptEntry,
  scopes: ScopeTables,
): { conditions: string; jump: string } {
  const conditions = formatArgs(opcode.args, entry, { scopes });
  const label = formatArgs(gotoOpcode.args, jump, { scopes });
  return { conditions, jump: `${GOTO}(${label})` };
}
