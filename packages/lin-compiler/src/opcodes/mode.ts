import { Character, Mode, UserInterface } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, ParameterType, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";
import { parseParameter } from "./arguments.ts";

/**
 * `Mode(Thinking)` / `Mode(Speaking, Monokuma)` is source-only sugar for the two opcodes that start
 * a character's lines: `SetUI(Thinking, Shown|Hidden)`, which switches the textbox between the
 * thought bubble and spoken dialogue, and `Speaker(character)`. The character defaults to Makoto,
 * who does all the thinking and most of the talking.
 *
 * The game writes the Thinking toggle as part of a run of `SetUI` lines (`CameraLook Hidden`,
 * `Thinking Shown`, `Name Shown`, `Textbox Shown`) that ends in `Speaker`, so the two opcodes are
 * usually not adjacent. The decompiler therefore collapses the nearest Thinking toggle in the run of
 * `SetUI` entries directly before a `Speaker` and writes the `Mode(...)` where the `Speaker` was, with
 * the rest of the run before it; compiling emits the toggle right before the Speaker. Every SetUI is
 * an independent switch, so moving the toggle to the end of its run does not change what the game
 * does, but the bytes are not identical to the shipped file after a round trip.
 *
 * A Thinking toggle with no Speaker after its run, and a Speaker with no toggle before it, stay plain.
 */

/** Source name of the sugar. */
export const MODE = "Mode";

const DEFAULT_CHARACTER = Character.Makoto;

/** True for a `SetUI(Thinking, Shown|Hidden)` entry. */
function isThinkingToggle(entry: ScriptEntry): boolean {
  return (
    entry.opcode === Opcode.SetUI &&
    entry.args.length === 2 &&
    entry.args[0] === UserInterface.Thinking &&
    nameOfValue(Mode, entry.args[1]) !== undefined
  );
}

/**
 * Plan the collapse: maps the index of each `Speaker` entry that becomes a `Mode(...)` to the index
 * of the Thinking toggle it absorbs. `skipped` holds entries already claimed by other sugar, which
 * neither end nor belong to a run.
 */
export function planModeSugar(entries: readonly ScriptEntry[], skipped: ReadonlySet<number>): Map<number, number> {
  const plan = new Map<number, number>();
  entries.forEach((entry, index) => {
    if (entry.opcode !== Opcode.Speaker || entry.args.length !== 1 || skipped.has(index)) {
      return;
    }
    for (let j = index - 1; j >= 0 && entries[j].opcode === Opcode.SetUI && !skipped.has(j); j--) {
      if (isThinkingToggle(entries[j])) {
        plan.set(index, j);
        return;
      }
    }
  });
  return plan;
}

/** The argument text of a `Mode(...)`; the character is omitted when it is the default. */
export function formatMode(toggle: ScriptEntry, speaker: ScriptEntry): string {
  const mode = nameOfValue(Mode, toggle.args[1]) as string;
  const character = speaker.args[0];
  if (character === DEFAULT_CHARACTER) {
    return mode;
  }
  return `${mode}, ${nameOfValue(Character, character) ?? character}`;
}

/** Compile `Mode(mode[, character])` into its SetUI and Speaker entries. */
export function expandMode(argsText: string, line: number): ScriptEntry[] {
  const values = splitArgs(argsText);
  if (values.length === 0 || values.length > 2) {
    throw new SourceError(line, `${MODE} expects 1 or 2 arguments (mode, character), got ${values.length}`);
  }
  const mode = valueOfName(Mode, values[0]);
  if (mode === undefined) {
    throw new SourceError(line, `unknown mode '${values[0]}' for ${MODE}; expected Speaking or Thinking`);
  }
  const character =
    values.length === 2 ? parseParameter(ParameterType.Byte, Character, values[1], line) : [DEFAULT_CHARACTER];
  return [
    { opcode: Opcode.SetUI, args: [UserInterface.Thinking, mode] },
    { opcode: Opcode.Speaker, args: character },
  ];
}
