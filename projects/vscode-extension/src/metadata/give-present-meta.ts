import { isPresent, LinscriptInstructionName, Present } from "linscript-definitions";
import { presentConfiguration } from "../data/present-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/** Source-only sugar for `Present(id, Subtract, 1)`: hands a gift to a student in the free-time menu, removing one from the inventory. */
export const givePresentMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.GivePresent,
  hexcode: "0x0D",
  sugar: true,
  selfDescribing: true,
  parameters: [
    {
      name: "present",
      names: Present,
    },
  ] as const,
  decorations: ([present]) => {
    if (!isPresent(present)) {
      return [{ contentText: `Invalid present: ${present}` }];
    }
    return [{ contentText: `🎁 Give ${presentConfiguration[present].name}` }];
  },
};
