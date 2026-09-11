import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/** Source-only sugar for `SetVariable(Wait, Assign, frames)`, the game's script pause. */
export const waitMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Wait,
  hexcode: "0x33",
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
