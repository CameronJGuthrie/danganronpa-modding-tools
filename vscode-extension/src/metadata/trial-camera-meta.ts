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
      name: "trackId",
      description: "(guess) refers to a path that the camera follows",
    },
  ] as const,
};
