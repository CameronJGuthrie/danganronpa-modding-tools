import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

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
