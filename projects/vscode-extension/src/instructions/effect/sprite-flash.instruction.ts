import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const spriteFlashInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.SpriteFlash,
  description:
    "Flashes or shakes the bust-up sprite for a number of frames; used with Rumble for outbursts. The other arguments are not yet understood.",
  parameters: [
    {
      name: "",
    },
    {
      name: "",
    },
    {
      name: "frames",
      description: "duration in frames",
    },
    {
      name: "",
    },
    {
      name: "",
    },
  ] as const,
};
