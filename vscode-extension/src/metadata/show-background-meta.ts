import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

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
