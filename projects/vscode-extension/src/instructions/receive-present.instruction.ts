import { isPresent, LinscriptInstructionName, Present, presentConfiguration } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/** Source-only sugar for `Present(id, +=, 1)`: awards the player one of an item as a story reward. */
export const receivePresentInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.ReceivePresent,
  description: "Awards the player one of an item as a story reward; sugar for the hidden Present(id, +=, 1) opcode.",
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
    return [{ contentText: `📦 Receive ${presentConfiguration[present].name}` }];
  },
};
