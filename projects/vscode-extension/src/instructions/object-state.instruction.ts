import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const objectStateInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.ObjectState,
  description:
    "Sets the state of a placed map object (declared with Object(id, Name) in Meta()). The four trailing arguments are not yet understood and are always 0 or 1.",
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
