import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/** `LabelName(id, Name)` inside `Meta()`: names a jump label so the body can write `Label(Name)` and `Goto(Name)`. */
export const labelNameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.LabelName,
  annotation: true,
  selfDescribing: true,
  description: "Names a jump label address for this script; used by Label and Goto.",
  parameters: [{ name: "labelId" }, { name: "name" }] as const,
};
