import { backgrounds, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const animationInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Animation,
  description:
    "Plays a background animation (an LLFS flash-style effect) by id. Apart from the final state byte, the other arguments are not yet understood.",
  parameters: [
    {
      name: "id",
      values: backgrounds,
    },
    {
      unknown: true,
      description: "Always 0",
    },
    {
      unknown: true,
      description: "Always 0",
    },
    {
      unknown: true,
      description: "Always 0",
    },
    {
      unknown: true,
      description: "Always 0",
    },
    {
      unknown: true,
      description: "0 or 1",
      // Seen value 1 when background ID is 510, 509, 758, 3088, 3098
    },
    {
      name: "state",
      unknown: true,
      description: "The state of the animation",
      // animations can have different states (0, 1, 2 etc).
      // 255 might be RESET, STOP or N/A or it might depend on the animation file itself, I have yet to unpick that.
      // For backgroundId 411, this can have value 20 and 22, seen only once each, and with no 6...19 or 21, this suggests animations can define their own custom states.
    },
  ] as const,
  decorations([id, _2, _3, _4, _5, _6, _state]) {
    return [{ contentText: `🏔️ ${backgrounds?.[id] ?? id}` }];
  },
};
