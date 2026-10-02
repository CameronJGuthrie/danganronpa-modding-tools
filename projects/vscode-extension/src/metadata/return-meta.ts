import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const returnMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Return,
  hexcode: "0x1C",
  description: "Ends the current script, execution continues from the RunScript() that invoked it.",
  parameters: [] as const,
};
