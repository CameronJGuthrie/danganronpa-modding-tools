import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const loadMapMeta: OpcodeMeta = {
  name: OpcodeName.LoadMap,
  opcode: "0x15",
  parameters: [
    {
      unknown: true,
    },
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
};
