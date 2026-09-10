import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const showBackgroundMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ShowBackground,
  hexcode: "0x30",
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
