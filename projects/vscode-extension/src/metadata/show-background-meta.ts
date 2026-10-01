import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const showBackgroundMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ShowBackground,
  hexcode: "0x30",
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
