import { FadeColour, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** The game's ScreenFade opcode moves a single full-screen curtain whose colour is set by each fade, so a fade in need not match the colour of the fade out before it. */
export const fadeOutThenWaitInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.FadeOutThenWait,
  description:
    "Covers the screen with a full-screen colour and finishes the fade before the script continues; sugar for the hidden ScreenFade(101, colour, frames) opcode. The scripts write it only where the script is about to be left (LoadScript, Return, StopScript or a jump to the exit label), so the fade is not cut short by the load.",
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
    return `screen → ${colourName} over ${seconds}s, then continue`;
  },
};
