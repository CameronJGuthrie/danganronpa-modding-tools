import { Character } from "./character.ts";

/**
 * Character ids that have recorded voice lines and so are valid as the character of the `Voice`
 * opcode: the sixteen students, Junko, Genocide Jill and Usami. No other id appears there.
 */
export type VoiceCharacter =
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
  | Character.GenocideJill
  | Character.Usami;

const voiceCharacterIds: ReadonlySet<number> = new Set<number>([
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
  Character.GenocideJill,
  Character.Usami,
]);

/**
 * The `Character` table restricted to the characters with voice lines. Same shape as an enum
 * object (name -> id and id -> name).
 */
export const VoiceCharacter: Readonly<Record<string, string | number>> = Object.freeze(
  Object.fromEntries(
    Object.entries(Character).filter(([key, value]) =>
      voiceCharacterIds.has(typeof value === "number" ? value : Number(key)),
    ),
  ),
);

export function isVoiceCharacter(characterId: number): characterId is VoiceCharacter {
  return voiceCharacterIds.has(characterId);
}
