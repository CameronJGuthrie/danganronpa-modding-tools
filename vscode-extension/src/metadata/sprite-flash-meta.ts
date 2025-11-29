import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const spriteFlashMeta: OpcodeMeta = {
  name: OpcodeName.SpriteFlash,
  opcode: "0x20",
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
