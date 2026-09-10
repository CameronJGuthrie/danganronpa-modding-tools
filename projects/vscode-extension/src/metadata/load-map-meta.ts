import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadMapMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadMap,
  hexcode: "0x15",
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
