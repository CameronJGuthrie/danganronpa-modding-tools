import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const cameraFlashMeta: OpcodeMeta = {
  name: OpcodeName.CameraFlash,
  opcode: "0x2E",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
