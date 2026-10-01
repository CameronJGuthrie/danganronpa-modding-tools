import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const restartScriptMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.RestartScript,
  hexcode: "0x1C",
  description: "Restarts the current script from the beginning; usually followed by StopScript().",
  parameters: [] as const,
};
