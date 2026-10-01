import { isPresent, LinscriptInstructionName, Present } from "linscript-definitions";
import { presentConfiguration } from "../data/present-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/** Source-only sugar for `Present(id, Add, 1)`: awards the player one of an item as a story reward. */
export const receivePresentMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ReceivePresent,
  hexcode: "0x0D",
  description: "Awards the player one of an item as a story reward; sugar for the hidden Present(id, Add, 1) opcode.",
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
