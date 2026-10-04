import { Opcode, SPRITE_HEAD } from "../definitions/opcode.definition.ts";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";
import { formatArgs, parseFixed } from "./arguments.ts";

/**
 * `PlaceSprite(slot, character, expression)` is source-only sugar for
 * `Sprite(slot, character, expression, 0, 0)`: a transition byte of zero sets the slot's sprite
 * without showing a bust-up (courtroom stands before `TrialCamera`, free-roam placement, and the
 * `Invisible` sprite cleanup), and the position byte is zero on 6743 of the game's 6928 such
 * lines. The remaining lines carry other position bytes (1, 11, 21, 31, ...) whose meaning is not
 * known, so they stay plain `Sprite(...)`; both bytes are matched numerically rather than through
 * the `SpriteTransition` / `SpritePosition` tables. Like `Wait` it is not a binary opcode: the
 * reader expands it and the writer collapses every matching Sprite back into it.
 */

/** Source name of the sugar. */
export const PLACE_SPRITE = "PlaceSprite";

/** The transition and position bytes the sugar stands for. */
const TAIL = [0, 0];

/** The layout of the sugar's three arguments, shared with the head of `Sprite`. */
const LAYOUT = { kind: "fixed", layout: SPRITE_HEAD } as const;

/** True for a Sprite entry whose transition and position bytes are both zero. */
export function isPlaceSprite(entry: ScriptEntry): boolean {
  return (
    entry.opcode === Opcode.Sprite &&
    entry.args.length === SPRITE_HEAD.length + TAIL.length &&
    entry.args[3] === TAIL[0] &&
    entry.args[4] === TAIL[1]
  );
}

/** The `slot, character, expression` of a PlaceSprite entry, as source argument text. */
export function formatPlaceSprite(entry: ScriptEntry, scopes: ScopeTables): string {
  return formatArgs(LAYOUT, { opcode: entry.opcode, args: entry.args.slice(0, SPRITE_HEAD.length) }, { scopes });
}

/** Compile `PlaceSprite(slot, character, expression)` into its Sprite entry. */
export function expandPlaceSprite(argsText: string, line: number, scopes: ScopeTables): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== SPRITE_HEAD.length) {
    throw new SourceError(
      line,
      `${PLACE_SPRITE} expects ${SPRITE_HEAD.length} arguments (slot, character, expression), got ${values.length}`,
    );
  }
  return { opcode: Opcode.Sprite, args: [...parseFixed(PLACE_SPRITE, SPRITE_HEAD, argsText, line, scopes), ...TAIL] };
}
