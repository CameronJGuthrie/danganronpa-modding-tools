import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * `OptionName(id, Name)` inside `Meta()`: names a menu option id so the body can write
 * `SetOption(Name)` and `Option(Name, "label")`. Ids 18 and 19 are `Exit_1` and `Exit_2` in every
 * script without being declared; a declared entry may override them.
 */
export const optionNameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OptionName,
  annotation: true,
  selfDescribing: true,
  description: 'Names a menu option id for this script; used by SetOption and the Option(id, "label") sugar.',
  parameters: [{ name: "optionId" }, { name: "name" }] as const,
};
