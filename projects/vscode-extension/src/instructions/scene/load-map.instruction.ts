import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const loadMapInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.LoadMap,
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
