import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const spriteFlash: OpcodeMeta = {
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
