import { Character } from "./character.ts";

/**
 * Character ids that have bust-up sprites and so are valid as the character of the `Sprite`
 * opcode: the sixteen students, Junko, Alter Ego and Usami. Every other id never appears there.
 */
export type CharacterSprite =
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
  | Character.Monokuma
  | Character.Junko
  | Character.AlterEgo
  | Character.Usami;

const characterSpriteIds: ReadonlySet<number> = new Set<number>([
  Character.Makoto,
  Character.Taka,
  Character.Byakuya,
  Character.Mondo,
  Character.Leon,
  Character.Hifumi,
  Character.Hiro,
  Character.Sayaka,
  Character.Kyoko,
  Character.Aoi,
  Character.Toko,
  Character.Sakura,
  Character.Celeste,
  Character.Mukuro,
  Character.Chihiro,
  Character.Monokuma,
  Character.Junko,
  Character.AlterEgo,
  Character.Usami,
]);

/**
 * The `Character` table restricted to the characters with sprites. Same shape as an enum object
 * (name -> id and id -> name).
 */
export const CharacterSprite: Readonly<Record<string, string | number>> = Object.freeze(
  Object.fromEntries(
    Object.entries(Character).filter(([key, value]) =>
      characterSpriteIds.has(typeof value === "number" ? value : Number(key)),
    ),
  ),
);

export function isCharacterSprite(characterId: number): characterId is CharacterSprite {
  return characterSpriteIds.has(characterId);
}
