import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const trialCameraMeta: OpcodeMeta = {
  name: OpcodeName.TrialCamera,
  hexcode: "0x14",
  parameters: [
    {
      name: "characterId",
    },
    {
      unknown: true, // seems likely to be one number (MSB)
    },
    {
      unknown: true, // seems likely to be one number (LSB)
    },
  ] as const,
};
