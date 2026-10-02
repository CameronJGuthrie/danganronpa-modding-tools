import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const returnInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Return,
  description: "Ends the current script, execution continues from the RunScript() that invoked it.",
  parameters: [] as const,
};
