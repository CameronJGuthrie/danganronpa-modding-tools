import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * Where a `Sprite(...)` bust-up stands on screen (its fifth argument).
 *
 * Shown bust-ups only use 0-4. `Set` placement lines also carry values such as 6, 11, 21 and 31,
 * which follow no screen layout and stay numeric; they look like a map-placement offset rather than
 * a position.
 */
export const SpritePosition = defineEnum({
  Leftmost: 0,
  Left: 1,
  Center: 2,
  Right: 3,
  Rightmost: 4,
});
export type SpritePosition = EnumValue<typeof SpritePosition>;

const spritePositionSet = new Set<number>(Object.values(SpritePosition).filter((v) => typeof v === "number"));

export function isSpritePosition(position: number): position is SpritePosition {
  return spritePositionSet.has(position);
}
