import { FadeColour, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** The game's ScreenFade opcode moves a single full-screen curtain whose colour is set by each fade, so a fade in need not match the colour of the fade out before it. */
export const fadeInInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.FadeIn,
  description:
    "Reveals the screen from a full-screen colour over the given frames; sugar for the hidden ScreenFade(0, colour, frames) opcode. Almost every script opens with FadeOut(DefaultBlack, 1) and reveals with FadeIn(Black, 24).",
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
    return `${colourName} → screen over ${seconds}s`;
  },
};
