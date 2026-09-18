import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const objectStateMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ObjectState,
  hexcode: "0x23",
  parameters: [
    {
      name: "objectId",
      scope: "Object", // shares the OnObject id space: a file's ids are used by one or the other, never both
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
