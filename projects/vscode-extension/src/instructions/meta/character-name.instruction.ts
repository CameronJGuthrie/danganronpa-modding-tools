import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * `CharacterName(slot, Name)` inside `Meta()`: names a placed-character slot so the body can write
 * `OnCharacter(Name)`. Slots are the last argument of the setup `Sprite(...)` lines, not the
 * `Character` enum, so they are declared per script.
 */
export const characterNameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.CharacterName,
  annotation: true,
  selfDescribing: true,
  description: "Names a placed-character slot for this script; used by OnCharacter.",
  parameters: [{ name: "slot" }, { name: "name" }] as const,
};
