import {
  CharacterSprite,
  characterData,
  isCharacterSprite,
  isSpritePosition,
  isSpriteTransition,
  LinscriptInstructionName,
  SpritePosition,
  SpriteTransition,
  spriteNamesByCharacter,
  sprites,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const spriteInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Sprite,
  description:
    "Shows, hides or places a character bust-up in a slot with a transition and screen position. A Set transition on a slot makes it a placed, interactable character; with position 0 that is written as PlaceSprite. The slot is the last argument.",
  parameters: [
    {
      name: "character",
      description: "The character whose sprite is shown; only the students, Junko, Alter Ego and Usami have sprites",
      names: CharacterSprite,
    },
    {
      name: "spriteId",
      description:
        "The expression; Invisible (98) is a transparent sprite that keeps the character placed but unseen, and 97 is only used with RemoveFromMap",
      namesBy: { argument: -1, tables: spriteNamesByCharacter },
    },
    {
      name: "transition",
      description:
        "How the bust-up enters, leaves or is placed. Exits render nothing on an empty slot. " +
        "The scripts never animate two consecutive Sprite lines: a second character leaving alongside a FadeOut uses HideInstant",
      names: SpriteTransition,
      values: {
        [SpriteTransition.Set]:
          "Set the slot's sprite without showing a bust-up (courtroom stands, placement, sprite 98 cleanup)",
        [SpriteTransition.FadeIn]: "Fade in (the default entrance)",
        [SpriteTransition.SlowFadeIn]: "Slow fade in",
        [SpriteTransition.HideInstant]: "Hide with no animation (screen is black, or second of two leaving)",
        [SpriteTransition.FadeOut]: "Fade out (the default exit)",
        [SpriteTransition.WalkOff]: "Leave the scene; paired with footsteps or door sounds and a Wait",
        [SpriteTransition.PopIn]: "Slide up from the bottom; Monokuma after Sound(133)",
        [SpriteTransition.PopOut]: "Slide down off the bottom; Monokuma after Sound(133)",
        [SpriteTransition.ShowInstant]: "Show with no animation (screen is black)",
        [SpriteTransition.WorkshopOverlay]: "Lower-left placement used only by the Monokuma workshop script",
        [SpriteTransition.RemoveFromMap]: "Take the character off the map; only used with sprite 97",
      },
    },
    {
      name: "position",
      description:
        "Where the bust-up stands. Set placement lines also use values such as 11, 21 and 31, which look like a map offset and stay numeric",
      names: SpritePosition,
    },
    {
      name: "slot",
      description:
        "The sprite layer the bust-up occupies: 0 for the speaker, 1 for a second character on screen, and higher slots for placed stands and lineups. First in binary, written last",
      // The game has two dialogue bust-up layers. A shown bust-up at a dialogue position (Left to
      // Rightmost) with a slot above 1 reads past them: a FadeIn into slot 2 has started a movie in
      // testing. Set placements and Leftmost lineups (the chapter 2 and 3 crime-scene rosters, and
      // the mass FadeOut/SlowFadeIn exits) use higher slots legitimately, so only five shipped lines
      // warn: the Left lineups in e02_027_029 and e03_044_030.
      range: ([, , transition, position]) =>
        transition !== SpriteTransition.Set && isDialoguePosition(position) ? { min: 0, max: 1 } : undefined,
    },
  ] as const,
  decorations([character, spriteId, transition, position]) {
    if (!isCharacterSprite(character)) {
      return [{ contentText: `Unknown sprite character ${character}`, color: "gray" }];
    }

    const { name, color } = characterData[character];

    const expression = sprites?.[character]?.[spriteId] ?? "Unknown Sprite";
    const transitionName = isSpriteTransition(transition) ? ` (${transitions[transition]})` : "";
    const positionName = isSpritePosition(position) ? ` ${SpritePosition[position]}` : "";

    return [{ contentText: `${name}: «${expression}»${transitionName}${positionName}`, color }];
  },
};

/** A screen position a dialogue bust-up stands at; Leftmost is also where lineups and exits are written. */
function isDialoguePosition(position: number): boolean {
  return position >= SpritePosition.Left && position <= SpritePosition.Rightmost;
}

const transitions: Readonly<Record<SpriteTransition, string>> = {
  [SpriteTransition.Set]: "set",
  [SpriteTransition.FadeIn]: "fade in",
  [SpriteTransition.SlowFadeIn]: "slow fade in",
  [SpriteTransition.HideInstant]: "hide",
  [SpriteTransition.FadeOut]: "fade out",
  [SpriteTransition.WalkOff]: "walk off",
  [SpriteTransition.PopIn]: "pop in",
  [SpriteTransition.PopOut]: "pop out",
  [SpriteTransition.ShowInstant]: "show",
  [SpriteTransition.WorkshopOverlay]: "workshop overlay",
  [SpriteTransition.RemoveFromMap]: "remove from map",
};
