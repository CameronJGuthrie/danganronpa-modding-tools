import { FunctionName, LinscriptFunction } from "../enum/function";

export const spriteFlash: LinscriptFunction = {
  name: FunctionName.SpriteFlash,
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
