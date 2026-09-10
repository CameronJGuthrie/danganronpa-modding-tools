import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const spriteFlashMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SpriteFlash,
  hexcode: "0x20",
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
