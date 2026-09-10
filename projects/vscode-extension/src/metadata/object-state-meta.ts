import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const objectStateMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ObjectState,
  hexcode: "0x23",
  parameters: [
    {
      unknown: true, // you would think this would be the objectId, but the object doesn't seem to be used within the script
      // it might be part of the map
    },
    {
      unknown: true, // likely combined 2 and 3. Always 0 or 1
    },
    {
      unknown: true, // likely combined 2 and 3. Always 0
    },
    {
      unknown: true, // also likely combined 4 and 5. Always 0 or 1
    },
    {
      unknown: true, // also likely combined 4 and 5. Always 0
    },
  ] as const,
};
