import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const stopScriptInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.StopScript,
  description:
    "Ends execution of the current script. Follows LoadScript and Return as unreachable padding on the normal path.",
  parameters: [] as const,
};
