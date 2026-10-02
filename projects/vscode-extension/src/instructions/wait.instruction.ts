import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/** Source-only sugar for `SetVariable(Wait, Assign, frames)`, the game's script pause. */
export const waitInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Wait,
  sugar: true,
  selfDescribing: true,
  description: "Pauses the script for a number of frames (60 per second).",
  parameters: [
    {
      name: "frames",
    },
  ] as const,
  decorations([frames]) {
    return `⏱ ${(frames / 60).toFixed(2)}s`;
  },
};
