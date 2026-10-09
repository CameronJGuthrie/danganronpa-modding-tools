import { Opcode, SPRITE_HEAD, spriteSlot } from "../definitions/opcode.definition.ts";
import type { ScopeTables } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";
import { formatArgs, parseFixed, toBinaryOrder, toSourceOrder } from "./arguments.ts";

/**
 * `PlaceSprite(character, expression, slot)` is source-only sugar for
 * `Sprite(character, expression, Set, 0, slot)`, whose binary bytes are `slot, character,
 * expression, 0, 0`: a transition byte of zero sets the slot's sprite without showing a bust-up
 * (courtroom stands before `TrialCamera`, free-roam placement, and the `Invisible` sprite cleanup),
 * and the position byte is zero on 6743 of the game's 6928 such lines. The remaining lines carry
 * other position bytes (1, 11, 21, 31, ...) whose meaning is not known, so they stay plain
 * `Sprite(...)`; both bytes are matched numerically rather than through the `SpriteTransition` /
 * `SpritePosition` tables. Like `Wait` it is not a binary opcode: the reader expands it and the
 * writer collapses every matching Sprite back into it.
 */

/** Source name of the sugar. */
export const PLACE_SPRITE = "PlaceSprite";

/** The transition and position bytes the sugar stands for. */
const TAIL = [0, 0];

/** The sugar's source layout: the head of `Sprite` with the slot last. */
const LAYOUT_PARAMETERS = [...SPRITE_HEAD, spriteSlot];
const LAYOUT = { kind: "fixed", layout: LAYOUT_PARAMETERS } as const;

/** The binary slot of each source argument once the sugar's fixed bytes are stripped. */
const BINARY_ORDER = [1, 2, 0];

/** True for a Sprite entry whose transition and position bytes are both zero. */
export function isPlaceSprite(entry: ScriptEntry): boolean {
  return (
    entry.opcode === Opcode.Sprite &&
    entry.args.length === LAYOUT_PARAMETERS.length + TAIL.length &&
    entry.args[3] === TAIL[0] &&
    entry.args[4] === TAIL[1]
  );
}

/** The `character, expression, slot` of a PlaceSprite entry, as source argument text. */
export function formatPlaceSprite(entry: ScriptEntry, scopes: ScopeTables): string {
  const args = toSourceOrder(LAYOUT_PARAMETERS, BINARY_ORDER, entry.args.slice(0, LAYOUT_PARAMETERS.length));
  return formatArgs(LAYOUT, { opcode: entry.opcode, args }, { scopes });
}

/** Compile `PlaceSprite(character, expression, slot)` into its Sprite entry. */
export function expandPlaceSprite(argsText: string, line: number, scopes: ScopeTables): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== LAYOUT_PARAMETERS.length) {
    throw new SourceError(
      line,
      `${PLACE_SPRITE} expects ${LAYOUT_PARAMETERS.length} arguments (character, expression, slot), got ${values.length}`,
    );
  }
  const args = toBinaryOrder(LAYOUT_PARAMETERS, BINARY_ORDER, parseFixed(PLACE_SPRITE, LAYOUT_PARAMETERS, argsText, line, scopes));
  return { opcode: Opcode.Sprite, args: [...args, ...TAIL] };
}
