import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const showBackgroundInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.ShowBackground,
  description:
    "Shows a background by id in the given state; the scripts mostly call ShowBackground(0, n) between ScreenFade calls.",
  parameters: [
    {
      name: "backgroundId",
    },
    {
      name: "state",
    },
  ] as const,
  decorations: ([backgroundId, state]) => {
    return `BG ${backgroundId} @ ${state}`;
  },
};
