import { Character } from "../character.ts";
import { sprites } from "./sprite/index.ts";

/**
 * The expression id every character's sprite set reserves for a fully transparent TGA. Placing it
 * puts the character in the slot without drawing anyone: the scripts use it to make a placed
 * character interactable but unseen, and to clear a slot's bust-up.
 */
export const INVISIBLE_SPRITE = 98;

const SHARED_NAMES: { [spriteId: number]: string } = {
  [INVISIBLE_SPRITE]: "Invisible",
};

/**
 * The names a sprite expression can be written by in `.linscript`, per character id: the shared
 * `Invisible` plus that character's rows in `sprites` (`data/sprite/<character>-sprite-data.ts`).
 * Each table maps names to ids and ids back to names, like an enum object. Name an expression by
 * adding a row to the character's table; ids without a row stay numeric.
 */
export const spriteNamesByCharacter: Readonly<Record<number, Readonly<Record<string, string | number>>>> =
  Object.freeze(
    Object.fromEntries(
      Object.values(Character)
        .filter((id): id is Character => typeof id === "number")
        .map((id) => [id, namesOf(sprites[id] ?? {})]),
    ),
  );

function namesOf(rows: { [spriteId: number]: string }) {
  const table: Record<string, string | number> = {};
  for (const [id, name] of Object.entries({ ...SHARED_NAMES, ...rows })) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || Object.hasOwn(table, name)) {
      throw new Error(`sprite name ${JSON.stringify(name)} (expression ${id}) must be a unique identifier`);
    }
    table[name] = Number(id);
    table[id] = name;
  }
  return Object.freeze(table);
}
