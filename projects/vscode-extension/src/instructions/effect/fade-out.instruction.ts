import { FadeColour, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** The game's ScreenFade opcode moves a single full-screen curtain whose colour is set by each fade, so a fade in need not match the colour of the fade out before it. */
export const fadeOutInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.FadeOut,
  description:
    "Covers the screen with a full-screen colour over the given frames; sugar for the hidden ScreenFade(1, colour, frames) opcode. Used before an in-script change of background or sprites, which a FadeIn then reveals.",
  sugar: true,
  parameters: [
    {
      name: "colour",
      names: FadeColour,
      description: "DefaultBlack (0) is a second black the scripts assert at their start; Red is never used",
    },
    {
      name: "frames",
      description: "Duration in frames (60 per second)",
    },
  ] as const,
  decorations([colour, frames]) {
    const colourName = FadeColour[colour as FadeColour] ?? String(colour);
    const seconds = (frames / 60).toFixed(2);
    return `screen → ${colourName} over ${seconds}s`;
  },
};
