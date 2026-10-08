import { Opcode } from "../definitions/opcode.definition.ts";
import { ParameterType } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BinaryError, SourceError } from "../errors.ts";
import { parseArg, splitArgs } from "../parameter.ts";

/**
 * Source-only sugar for the binary `DebateLabel` opcode (0x2e), whose two bytes are one big-endian
 * 16-bit id. It is a case label for the Nonstop Debate engine, not an instruction: the script jumps
 * over the whole table with a `Goto`, the engine raises an event id and runs the script from the
 * label with that id until a `Goto`. A label with nothing of its own falls through to the next one,
 * which is why the shipped tables are long runs of consecutive ids ending in one block of code.
 * The id is `kind × 10000 + statement index`:
 *
 * | Id          | Source                     | Meaning                                                  |
 * |-------------|----------------------------|----------------------------------------------------------|
 * | k           | `DebateStatement(k)`       | statement k of the debate (the `_001` statement script)  |
 * | k           | `OnDebateMiss(k)`          | a wrong shot at statement k (the `_000` handler script)  |
 * | 10000 + k   | `OnDebateHit(k)`           | the right Truth Bullet hit statement k                   |
 * | 20000 + k   | `OnDebateCounter(k)`       | statement k was hit with an absorbed statement           |
 * | 30000 + k   | `OnDebateUnknown(k)`       | never holds code in the shipped scripts                  |
 * | 40000       | `OnDebateLoop()`           | the statements repeated without a hit                    |
 * | 50000       | `OnDebateInfluenceEmpty()` | the Influence gauge ran out (runs subroutine scene 198)  |
 * | 60000       | `OnDebateTimeout()`        | the timer ran out (runs subroutine scene 199)            |
 * | 65535       | `DebateEnd()`              | end of the table                                         |
 *
 * The statement index is the record index in the debate's `nonstop_CC_NNN.dat`, whose records
 * also carry the bullet id behind each `OnDebateHit` and the partner statement behind each
 * `OnDebateCounter`. The same kind-0 bytes mean "statement k" in the statement script, where each
 * label is followed by the statement's sprite, voice and text, and "miss on statement k" in the
 * handler script, which the decompiler tells apart by whether the script has any label of a
 * higher kind: every handler table at least ends with the Influence and timer handlers.
 *
 * The opcode is a block opener, so the lines up to the next label are indented under it, and
 * `DebateEnd()` closes the block like the 255 of `SetOption` and `OnObject`. `DebateLabel` itself
 * is hidden: a loop, Influence or timer id that carries a statement index is a decompile error.
 */

export const DEBATE_STATEMENT = "DebateStatement";
export const ON_DEBATE_MISS = "OnDebateMiss";
export const ON_DEBATE_HIT = "OnDebateHit";
export const ON_DEBATE_COUNTER = "OnDebateCounter";
export const ON_DEBATE_UNKNOWN = "OnDebateUnknown";
export const ON_DEBATE_LOOP = "OnDebateLoop";
export const ON_DEBATE_INFLUENCE_EMPTY = "OnDebateInfluenceEmpty";
export const ON_DEBATE_TIMEOUT = "OnDebateTimeout";
export const DEBATE_END = "DebateEnd";

export type DebateSugarName =
  | typeof DEBATE_STATEMENT
  | typeof ON_DEBATE_MISS
  | typeof ON_DEBATE_HIT
  | typeof ON_DEBATE_COUNTER
  | typeof ON_DEBATE_UNKNOWN
  | typeof ON_DEBATE_LOOP
  | typeof ON_DEBATE_INFLUENCE_EMPTY
  | typeof ON_DEBATE_TIMEOUT
  | typeof DEBATE_END;

/** Ids are `kind * KIND_SIZE + statement`. */
const KIND_SIZE = 10000;

/** The id of `DebateEnd()`. */
const END_ID = 0xffff;

/** The kind of each sugar name, and whether it takes a statement index. */
const KINDS: Record<DebateSugarName, { kind: number; indexed: boolean }> = {
  [DEBATE_STATEMENT]: { kind: 0, indexed: true },
  [ON_DEBATE_MISS]: { kind: 0, indexed: true },
  [ON_DEBATE_HIT]: { kind: 1, indexed: true },
  [ON_DEBATE_COUNTER]: { kind: 2, indexed: true },
  [ON_DEBATE_UNKNOWN]: { kind: 3, indexed: true },
  [ON_DEBATE_LOOP]: { kind: 4, indexed: false },
  [ON_DEBATE_INFLUENCE_EMPTY]: { kind: 5, indexed: false },
  [ON_DEBATE_TIMEOUT]: { kind: 6, indexed: false },
  [DEBATE_END]: { kind: -1, indexed: false },
};

/** The source name of every kind above 0; kind 0 depends on the script (`isDebateHandlerScript`). */
const NAME_OF_KIND: readonly DebateSugarName[] = [
  ON_DEBATE_MISS,
  ON_DEBATE_HIT,
  ON_DEBATE_COUNTER,
  ON_DEBATE_UNKNOWN,
  ON_DEBATE_LOOP,
  ON_DEBATE_INFLUENCE_EMPTY,
  ON_DEBATE_TIMEOUT,
];

export function isDebateSugarName(name: string): name is DebateSugarName {
  return Object.hasOwn(KINDS, name);
}

/** True for a binary DebateLabel entry. Whether it can be written as sugar is decided by `formatDebateLabel`. */
export function isDebateLabel(entry: ScriptEntry): boolean {
  return entry.opcode === Opcode.DebateLabel;
}

function labelId(entry: ScriptEntry): number {
  if (entry.args.length !== 2) {
    throw new BinaryError(`DebateLabel expects 2 bytes, got ${entry.args.length}`);
  }
  return entry.args[0] * 256 + entry.args[1];
}

/**
 * True when the script's labels form a handler table rather than a statement list: a statement
 * script only has kind-0 labels and the end marker.
 */
export function isDebateHandlerScript(entries: readonly ScriptEntry[]): boolean {
  return entries.some((entry) => {
    if (!isDebateLabel(entry)) {
      return false;
    }
    const id = labelId(entry);
    return id >= KIND_SIZE && id !== END_ID;
  });
}

/** The sugar name and argument text for a DebateLabel entry; throws when the id is not expressible. */
export function formatDebateLabel(entry: ScriptEntry, handlerScript: boolean): { name: DebateSugarName; args: string } {
  const id = labelId(entry);
  if (id === END_ID) {
    return { name: DEBATE_END, args: "" };
  }
  // A 16-bit id below 65535 is always of kind 0–6
  const kind = Math.floor(id / KIND_SIZE);
  const index = id % KIND_SIZE;
  const name = kind === 0 && !handlerScript ? DEBATE_STATEMENT : NAME_OF_KIND[kind];
  if (!KINDS[name].indexed) {
    if (index !== 0) {
      throw new BinaryError(`DebateLabel id ${id} carries statement ${index}, but ${name} takes none`);
    }
    return { name, args: "" };
  }
  return { name, args: String(index) };
}

/** Compile a debate label into its DebateLabel entry. */
export function expandDebateLabel(name: DebateSugarName, argsText: string, line: number): ScriptEntry {
  const { kind, indexed } = KINDS[name];
  const values = splitArgs(argsText);
  const expected = indexed ? 1 : 0;
  if (values.length !== expected) {
    throw new SourceError(line, `${name} expects ${expected} argument${expected === 1 ? " (statement)" : "s"}, got ${values.length}`);
  }
  if (name === DEBATE_END) {
    return { opcode: Opcode.DebateLabel, args: [0xff, 0xff] };
  }
  let index = 0;
  if (indexed) {
    const [high, low] = parseArg(ParameterType.UInt16BE, values[0], line);
    index = high * 256 + low;
    if (index >= KIND_SIZE) {
      throw new SourceError(line, `${name} statement must be below ${KIND_SIZE}, got ${index}`);
    }
  }
  const id = kind * KIND_SIZE + index;
  return { opcode: Opcode.DebateLabel, args: [Math.floor(id / 256), id % 256] };
}
