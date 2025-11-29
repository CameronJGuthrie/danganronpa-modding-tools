import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const showBackgroundMeta: OpcodeMeta = {
  name: OpcodeName.ShowBackground,
  opcode: "0x30",
  parameters: [
    {
      name: "backgroundId",
    },
    {
      name: "state",
    },
  ] as const,
  decorations: ([backgroundId, state]) => {
    return `BG ${backgroundId} @ ${state}`;
  },
};
