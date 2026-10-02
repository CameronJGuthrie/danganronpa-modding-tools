import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const cameraFlashInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.CameraFlash,
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
