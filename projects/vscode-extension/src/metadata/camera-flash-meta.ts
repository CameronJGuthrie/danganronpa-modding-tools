import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const cameraFlashMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.CameraFlash,
  hexcode: "0x2E",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
