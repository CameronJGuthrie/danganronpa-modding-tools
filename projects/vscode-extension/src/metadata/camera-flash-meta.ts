import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const cameraFlashMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.CameraFlash,
  hexcode: "0x2E",
  description: "Camera flash effect. Both arguments are not yet understood; the game scripts only ever pass (0, 0).",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
