import { Character } from "../character.ts";

/**
 * The expression id every character's sprite set reserves for a fully transparent TGA. Placing it
 * puts the character in the slot without drawing anyone: the scripts use it to make a placed
 * character interactable but unseen, and to clear a slot's bust-up.
 */
export const INVISIBLE_SPRITE = 98;

/**
 * Source names for sprite expression ids, per character: the third argument of `Sprite(...)` and
 * `PlaceSprite(...)`. Only `Invisible` (98) is named so far; the other expressions stay numeric
 * until each has a settled name. Add a row to a character's table to name one of its expressions.
 */
export const spriteNameDataByCharacter: Readonly<Record<number, { [spriteId: number]: { name: string } } | undefined>> = {
  [Character.Makoto]: {},
  [Character.Taka]: {},
  [Character.Byakuya]: {},
  [Character.Mondo]: {},
  [Character.Leon]: {},
  [Character.Hifumi]: {},
  [Character.Hiro]: {},
  [Character.Sayaka]: {},
  [Character.Kyoko]: {},
  [Character.Aoi]: {},
  [Character.Toko]: {},
  [Character.Sakura]: {},
  [Character.Celeste]: {},
  [Character.Mukuro]: {},
  [Character.Chihiro]: {},
  [Character.Monokuma]: {},
  [Character.Junko]: {},
  [Character.AlterEgo]: {},
  [Character.Usami]: {},
};

const SHARED_NAMES: { [spriteId: number]: { name: string } } = {
  [INVISIBLE_SPRITE]: { name: "Invisible" },
};

/**
 * The names a sprite expression can be written by in `.linscript`, per character id: the shared
 * `Invisible` plus that character's own rows. Each table maps names to ids and ids back to names,
 * like an enum object.
 */
export const spriteNamesByCharacter: Readonly<Record<number, Readonly<Record<string, string | number>>>> = Object.freeze(
  Object.fromEntries(
    Object.entries(spriteNameDataByCharacter).map(([character, rows]) => [Number(character), namesOf(rows ?? {})]),
  ),
);

function namesOf(rows: { [spriteId: number]: { name: string } }) {
  const table: Record<string, string | number> = {};
  for (const [id, { name }] of Object.entries({ ...SHARED_NAMES, ...rows })) {
    table[name] = Number(id);
    table[id] = name;
  }
  return Object.freeze(table);
}
