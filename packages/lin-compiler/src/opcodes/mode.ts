import { Character, Mode, UiVisibility, UserInterface } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, ParameterType, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";
import { parseParameter } from "./arguments.ts";

/**
 * `Mode(...)` is source-only sugar for the UI toggles that start a character's lines and the
 * `Speaker(character)` that follows them.
 *
 * - `Mode(Thinking)` / `Mode(Speaking, Monokuma)` stand for `SetUI(Textbox, Shown)`,
 *   `SetUI(Thinking, Shown|Hidden)`, which switches the textbox between the thought bubble and spoken
 *   dialogue, plus `SetUI(Name, Shown)` and the `Speaker`. The character defaults to Makoto, who does all the thinking and most of the
 *   talking. Every shipped line that switches the Thinking toggle has the name plate on, so the name
 *   toggle is implied: compiling always emits it, and decompiling absorbs one when it is in the run.
 * - `Mode(System)` stands for `SetUI(Textbox, Shown)`, `SetUI(Name, Hidden)` plus `Speaker(Blank)`:
 *   unattributed text such as sound effects and tutorial prompts. The character argument is only needed where a shipped script
 *   left a different character in the speaker register, `Mode(System, Makoto)`; nothing is drawn
 *   either way. A Thinking toggle in the same run stays plain before it.
 *
 * The game writes the toggles as part of a run of `SetUI` lines (`CameraLook Hidden`,
 * `Thinking Shown`, `Name Shown`, `Textbox Shown`) that ends in `Speaker`, so the opcodes are usually
 * not adjacent. The decompiler therefore collapses the nearest toggles in the run of `SetUI` entries
 * directly before a `Speaker` and writes the `Mode(...)` where the `Speaker` was, with the rest of
 * the run before it; compiling emits the toggles right before the Speaker. Every SetUI is an
 * independent switch, so moving a toggle to the end of its run, or adding an implied `Name Shown`,
 * does not change what the game does, but the bytes are not identical to the shipped file after a
 * round trip.
 *
 * Every mode also implies `SetUI(Textbox, Shown)`: the game opens the textbox for a `Text` anyway, so
 * the explicit toggle is redundant where it is written and harmless where it is not. Compiling always
 * emits it, and decompiling absorbs one from the run when it is there (about 58% of shipped Modes).
 * A `Textbox Shown` with no Mode after its run stays plain, as do `Textbox Hidden` toggles.
 *
 * A toggle with no Speaker after its run, and a Speaker with neither a Thinking toggle nor a
 * `Name Hidden` before it, stay plain.
 */

/** Source name of the sugar. */
export const MODE = "Mode";

const DEFAULT_CHARACTER = Character.Makoto;
const SYSTEM_CHARACTER = Character.Blank;

/** The toggles a `Mode(...)` absorbs: indexes into the entry list. */
export interface ModePlan {
  /** The `SetUI(Thinking, …)` entry, for Speaking/Thinking. */
  thinking?: number;
  /** The `SetUI(Name, …)` entry: `Hidden` for System, `Shown` for the other modes when present. */
  name?: number;
  /** The `SetUI(Textbox, Shown)` entry, when the run has one; implied otherwise. */
  textbox?: number;
}

/** True for a `SetUI(Textbox, Shown)` entry. */
function isTextboxShown(entry: ScriptEntry): boolean {
  return isToggle(entry, UserInterface.Textbox) && entry.args[1] === UiVisibility.Shown;
}

/** True for a `SetUI(ui, Shown|Hidden)` entry. */
function isToggle(entry: ScriptEntry, ui: number): boolean {
  return (
    entry.opcode === Opcode.SetUI &&
    entry.args.length === 2 &&
    entry.args[0] === ui &&
    (entry.args[1] === UiVisibility.Shown || entry.args[1] === UiVisibility.Hidden)
  );
}

/**
 * Plan the collapse: maps the index of each `Speaker` entry that becomes a `Mode(...)` to the toggles
 * it absorbs. `skipped` holds entries already claimed by other sugar, which neither end nor belong to
 * a run.
 */
export function planModeSugar(entries: readonly ScriptEntry[], skipped: ReadonlySet<number>): Map<number, ModePlan> {
  const plan = new Map<number, ModePlan>();
  entries.forEach((entry, index) => {
    if (entry.opcode !== Opcode.Speaker || entry.args.length !== 1 || skipped.has(index)) {
      return;
    }
    let thinking: number | undefined;
    let name: number | undefined;
    let textbox: number | undefined;
    for (let j = index - 1; j >= 0 && entries[j].opcode === Opcode.SetUI && !skipped.has(j); j--) {
      if (thinking === undefined && isToggle(entries[j], UserInterface.Thinking)) {
        thinking = j;
      } else if (name === undefined && isToggle(entries[j], UserInterface.Name)) {
        name = j;
      } else if (textbox === undefined && isTextboxShown(entries[j])) {
        textbox = j;
      }
    }
    let chosen: ModePlan | undefined;
    if (name !== undefined && entries[name].args[1] === UiVisibility.Hidden) {
      chosen = { name };
    } else if (thinking !== undefined) {
      chosen = name === undefined ? { thinking } : { thinking, name };
    }
    if (chosen !== undefined) {
      if (textbox !== undefined) {
        chosen.textbox = textbox;
      }
      plan.set(index, chosen);
    }
  });
  return plan;
}

/** The argument text of a `Mode(...)`; the character is omitted when it is the mode's default. */
export function formatMode(plan: ModePlan, entries: readonly ScriptEntry[], speaker: ScriptEntry): string {
  const system = plan.thinking === undefined;
  const mode = system ? "System" : (nameOfValue(Mode, entries[plan.thinking as number].args[1]) as string);
  const character = speaker.args[0];
  if (character === (system ? SYSTEM_CHARACTER : DEFAULT_CHARACTER)) {
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
    throw new SourceError(line, `unknown mode '${values[0]}' for ${MODE}; expected Speaking, Thinking or System`);
  }
  const system = mode === Mode.System;
  const character =
    values.length === 2
      ? parseParameter(ParameterType.Byte, Character, values[1], line)
      : [system ? SYSTEM_CHARACTER : DEFAULT_CHARACTER];
  const textbox: ScriptEntry = { opcode: Opcode.SetUI, args: [UserInterface.Textbox, UiVisibility.Shown] };
  if (system) {
    return [
      textbox,
      { opcode: Opcode.SetUI, args: [UserInterface.Name, UiVisibility.Hidden] },
      { opcode: Opcode.Speaker, args: character },
    ];
  }
  return [
    textbox,
    { opcode: Opcode.SetUI, args: [UserInterface.Thinking, mode] },
    { opcode: Opcode.SetUI, args: [UserInterface.Name, UiVisibility.Shown] },
    { opcode: Opcode.Speaker, args: character },
  ];
}
