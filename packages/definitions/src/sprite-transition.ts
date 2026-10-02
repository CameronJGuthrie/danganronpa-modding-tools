import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * How a `Sprite(...)` call shows, hides or places a character's bust-up (its fourth argument).
 *
 * Entrances expect an empty slot and exits expect a shown one, so an exit on an empty slot renders
 * nothing. Consecutive `Sprite` lines never animate twice in the game's scripts: when two characters
 * leave together the first fades out and the second uses `HideInstant`, so the engine appears to play
 * one transition at a time.
 */
export const SpriteTransition = defineEnum({
  /** Sets the slot's sprite without showing a bust-up: courtroom stands before `TrialCamera`, free-roam placement, and the `SetUI(BustUp, Hidden)` / sprite 98 cleanup. */
  Set: 0,
  /** The default entrance. */
  FadeIn: 1,
  /** A slower, dramatic entrance. */
  SlowFadeIn: 2,
  /** Removes the bust-up with no animation; used while the screen is black and for the second of two characters leaving together. */
  HideInstant: 3,
  /** The default exit. */
  FadeOut: 4,
  /** The character leaves the scene; paired with footstep or door sounds and a `Wait`. */
  WalkOff: 5,
  /** Slides up from the bottom of the screen; Monokuma's entrance after `Sound(133)`. */
  PopIn: 6,
  /** Slides down off the bottom of the screen; Monokuma's exit after `Sound(133)`. */
  PopOut: 7,
  /** Shows the bust-up with no animation; used while the screen is black, mirroring `HideInstant`. */
  ShowInstant: 8,
  /** Positions the sprite lower and to the left; only used by the Monokuma workshop script. */
  WorkshopOverlay: 9,
  /** Only ever used with sprite 97 to take a character off the map. */
  RemoveFromMap: 10,
});
export type SpriteTransition = EnumValue<typeof SpriteTransition>;

const spriteTransitionSet = new Set<number>(Object.values(SpriteTransition).filter((v) => typeof v === "number"));

export function isSpriteTransition(transition: number): transition is SpriteTransition {
  return spriteTransitionSet.has(transition);
}
