import { Character } from "./character.ts";

/** The highest character id with a report card: the sixteen students, Makoto through Monokuma. */
export const MAX_STUDENT_ID = 15;

/** Character ids that have a report card and so are valid in the student opcodes. */
export type Student =
  | Character.Makoto
  | Character.Taka
  | Character.Byakuya
  | Character.Mondo
  | Character.Leon
  | Character.Hifumi
  | Character.Hiro
  | Character.Sayaka
  | Character.Kyoko
  | Character.Aoi
  | Character.Toko
  | Character.Sakura
  | Character.Celeste
  | Character.Mukuro
  | Character.Chihiro
  | Character.Monokuma;

/**
 * The `Character` table restricted to ids 0–15: the sixteen students that the report card and
 * student-title opcodes accept. Same shape as an enum object (name -> id and id -> name).
 */
export const Student: Readonly<Record<string, string | number>> = Object.freeze(
  Object.fromEntries(
    Object.entries(Character).filter(([key, value]) =>
      typeof value === "number" ? value <= MAX_STUDENT_ID : Number(key) <= MAX_STUDENT_ID,
    ),
  ),
);

export function isStudent(characterId: number): characterId is Student {
  return Number.isInteger(characterId) && characterId >= 0 && characterId <= MAX_STUDENT_ID;
}
