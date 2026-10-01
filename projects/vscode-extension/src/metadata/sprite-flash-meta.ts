import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const spriteFlashMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SpriteFlash,
  hexcode: "0x20",
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
