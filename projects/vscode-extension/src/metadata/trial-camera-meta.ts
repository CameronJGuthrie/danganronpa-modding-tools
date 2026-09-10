import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const trialCameraMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.TrialCamera,
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
