import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadMapMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadMap,
  hexcode: "0x15",
  description:
    "Loads a room or map for exploration. The three arguments are not yet understood; the third is usually 255.",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
