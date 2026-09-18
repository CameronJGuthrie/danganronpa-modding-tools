import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/** `Object(id, Name)` inside `Meta()`: names an object id so the body can write `OnObject(Name)`. */
export const objectMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Object,
  hexcode: "",
  annotation: true,
  selfDescribing: true,
  description: "Names an object id for this script; used by OnObject and ObjectState.",
  parameters: [{ name: "objectId" }, { name: "name" }] as const,
};
