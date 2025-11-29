import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const trialCameraMeta: OpcodeMeta = {
  name: OpcodeName.TrialCamera,
  opcode: "0x14",
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
