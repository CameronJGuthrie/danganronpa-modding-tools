import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** `ObjectName(id, Name)` inside `Meta()`: names an object id so the body can write `OnObject(Name)`. */
export const objectNameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.ObjectName,
  annotation: true,
  selfDescribing: true,
  description: "Names an object id for this script; used by OnObject and ObjectState.",
  parameters: [{ name: "objectId" }, { name: "name" }] as const,
};
