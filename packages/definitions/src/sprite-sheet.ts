import { Character } from "./character.ts";
import { MAX_STUDENT_ID } from "./student.ts";

/**
 * Sprite sheets the `LoadSprite` opcode can load. Ids 0–15 are the students' sheets and share the
 * character names; 20, 29 and 30 also appear in the game's scripts but are not character ids
 * (20 would be MakotoMom and 29 has no character at all), so they keep placeholder names until
 * their contents are known.
 */
const unknownSpriteSheetIds = [20, 29, 30] as const;

/** The table as an enum-shaped object (name -> id and id -> name). */
export const SpriteSheet: Readonly<Record<string, string | number>> = Object.freeze(
  Object.fromEntries([
    ...Object.entries(Character).filter(([key, value]) =>
      typeof value === "number" ? value <= MAX_STUDENT_ID : Number(key) <= MAX_STUDENT_ID,
    ),
    ...unknownSpriteSheetIds.flatMap((id) => [
      [`SpriteSheet_${id}`, id],
      [String(id), `SpriteSheet_${id}`],
    ]),
  ]),
);

const spriteSheetIds: ReadonlySet<number> = new Set(
  Object.values(SpriteSheet).filter((value): value is number => typeof value === "number"),
);

export function isSpriteSheet(id: number): boolean {
  return spriteSheetIds.has(id);
}

/** The name for a sprite sheet id, if it is one. */
export function spriteSheetName(id: number): string | undefined {
  const name = SpriteSheet[id];
  return typeof name === "string" ? name : undefined;
}
