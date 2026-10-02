import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/** `Object(id, Name)` inside `Meta()`: names an object id so the body can write `OnObject(Name)`. */
export const objectInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Object,
  annotation: true,
  selfDescribing: true,
  description: "Names an object id for this script; used by OnObject and ObjectState.",
  parameters: [{ name: "objectId" }, { name: "name" }] as const,
};
