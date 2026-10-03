/**
 * Authoring types for a character's gift reactions (`e08_CCC_000`), consumed by
 * `mod/gift-dialogue.ts`. One file per character sits next to this one and exports a
 * `GiftDialogue`; the generator turns each present's `lines` into Sprite/Mode/Voice/Text
 * opcodes inside that present's `SetOption` handler.
 */

import type { Character } from "linscript-definitions";

/** Which result handler the present jumps to; also picks the gift sound (122 happy, 123 sad). */
export type Reaction = "Okay" | "Liked" | "Loved" | "Disliked" | "Hated";

/**
 * A Chapter_99 voice line: its id, or its transcript from `linscript-definitions` (the first
 * line with that exact transcript). The text need not quote it: a bark like "I'm so happy!" or
 * "Ummm..." just has to match the line's sentiment. Quote it verbatim only when the words are
 * part of the dialogue anyway ("Like I said, I'm psychic.").
 */
export type VoiceRef = number | string;

export type Line =
  /** The character speaks, switching to the named sprite (names from `sprites[character]`). */
  | { kind: "say"; sprite: string; text: string; voice?: VoiceRef }
  /** Makoto speaks. Free time scenes are first person, so he has no sprite. */
  | { kind: "makoto"; text: string; voice?: VoiceRef }
  /** Makoto's inner voice, wrapped in `<thought>`. */
  | { kind: "think"; text: string }
  /** Any other statement, written verbatim (`Sound(28)`, `SpriteFlash(...)`). */
  | { kind: "raw"; line: string };

export interface PresentDialogue {
  reaction: Reaction;
  /** The scene brief, written back into the script as `#` comments above the dialogue. */
  brief?: string[];
  lines: Line[];
}

export interface GiftDialogue {
  character: Character;
  /** Keyed by `Present` enum name. Every present the script offers must have an entry. */
  presents: Record<string, PresentDialogue>;
}

export function say(sprite: string, text: string, voice?: VoiceRef): Line {
  return { kind: "say", sprite, text, voice };
}

export function makoto(text: string, voice?: VoiceRef): Line {
  return { kind: "makoto", text, voice };
}

export function think(text: string): Line {
  return { kind: "think", text };
}

export function raw(line: string): Line {
  return { kind: "raw", line };
}
