import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The colour byte of the `FadeIn(...)` / `FadeOut(...)` / `FadeOutThenWait(...)` sugar, which
 * stands for the binary `ScreenFade(direction, colour, frames)` opcode: the colour of the
 * full-screen curtain the fade moves. The game's scripts use 0 as a second black: it opens almost
 * every script as `FadeOut(DefaultBlack, 1)` and is revealed again with `FadeIn(Black, 24)`, so the
 * two are not independent layers. Whether it looks any different from `Black` is untested; `Red`
 * is never used by the shipped scripts.
 */
export const FadeColour = defineEnum({
  DefaultBlack: 0,
  Black: 1,
  White: 2,
  Red: 3,
});
export type FadeColour = EnumValue<typeof FadeColour>;
