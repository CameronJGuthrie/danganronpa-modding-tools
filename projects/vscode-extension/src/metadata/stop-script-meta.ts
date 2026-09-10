import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const stopScriptMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.StopScript,
  hexcode: "0x1A",
  parameters: [] as const,
};
