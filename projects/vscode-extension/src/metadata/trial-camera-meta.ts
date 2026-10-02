import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const trialCameraMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.TrialCamera,
  description: "Moves the class trial camera to a character along a predefined track.",
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
