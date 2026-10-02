import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/** `LabelName(id, Name)` inside `Meta()`: names a jump label so the body can write `Label(Name)` and `Goto(Name)`. */
export const labelNameMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LabelName,
  hexcode: "",
  annotation: true,
  selfDescribing: true,
  description: "Names a jump label address for this script; used by Label and Goto.",
  parameters: [{ name: "labelId" }, { name: "name" }] as const,
};
