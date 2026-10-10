import { Character } from "./character.ts";
import { MAX_STUDENT_ID } from "./student.ts";

/**
 * Characters the map roster can place in a room (`MapCharacter(room, character, True)`). Ids 0–15
 * are the students and share the character names; 20, 29 and 30 also appear in the game's scripts
 * but are not character ids (20 would be MakotoMom, and 29 has no character at all), so they keep
 * placeholder names until their contents are known. 20 is placed in the bathhouse in chapters 3
 * and 4 and is probably Alter Ego; 29 and 30 appear in chapter 6 and in School Mode.
 *
 * Makoto cannot be placed in a room (presumably because he has no portrait)
 */
const unknownMapCharacterIds = [20, 29, 30] as const;

/** The table as an enum-shaped object (name -> id and id -> name). */
export const MapCharacter: Readonly<Record<string, string | number>> = Object.freeze(
  Object.fromEntries([
    ...Object.entries(Character).filter(([key, value]) =>
      typeof value === "number" ? value <= MAX_STUDENT_ID : Number(key) <= MAX_STUDENT_ID,
    ),
    ...unknownMapCharacterIds.flatMap((id) => [
      [`MapCharacter_${id}`, id],
      [String(id), `MapCharacter_${id}`],
    ]),
  ]),
);

const mapCharacterIds: ReadonlySet<number> = new Set(
  Object.values(MapCharacter).filter((value): value is number => typeof value === "number"),
);

export function isMapCharacter(id: number): boolean {
  return mapCharacterIds.has(id);
}

/** The name for a map character id, if it is one. */
export function mapCharacterName(id: number): string | undefined {
  const name = MapCharacter[id];
  return typeof name === "string" ? name : undefined;
}
