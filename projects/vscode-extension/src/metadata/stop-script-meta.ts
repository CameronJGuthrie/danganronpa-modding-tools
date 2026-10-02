import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const stopScriptMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StopScript,
  description:
    "Ends execution of the current script. Follows LoadScript and Return as unreachable padding on the normal path.",
  parameters: [] as const,
};
