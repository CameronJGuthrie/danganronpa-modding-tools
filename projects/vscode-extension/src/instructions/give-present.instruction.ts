import { isPresent, LinscriptInstructionName, Present, presentConfiguration } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/** Source-only sugar for `Present(id, -=, 1)`: hands a gift to a student in the free-time menu, removing one from the inventory. */
export const givePresentInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.GivePresent,
  description:
    "Hands a present to a student, removing one from the inventory; sugar for the hidden Present(id, -=, 1) opcode.",
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
