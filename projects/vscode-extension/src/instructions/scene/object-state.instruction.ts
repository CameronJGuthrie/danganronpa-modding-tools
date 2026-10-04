import { LinscriptInstructionName, ObjectInteraction, ObjectVisibility } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const objectStateInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.ObjectState,
  description:
    "Shows or removes a room-model object (declared with Object(id, Name) in Meta()) and says whether it can be examined. Scene entry scripts remove the objects the scene has not reached yet; a pickup removes itself from inside its own OnObject handler. A NonInteractable object is drawn but cannot be clicked even when the script has a handler for it. Both values are 16-bit little-endian in binary.",
  parameters: [
    {
      name: "objectId",
      scope: "Object", // shares the OnObject id space
    },
    {
      name: "visibility",
      description: "Visible draws the object, Invisible removes it from the room",
      names: ObjectVisibility,
    },
    {
      name: "interaction",
      description: "NonInteractable objects are drawn but cannot be examined, even with an OnObject handler",
      names: ObjectInteraction,
    },
  ] as const,
  decorations([, visibility, interaction]) {
    if (visibility === ObjectVisibility.Invisible) return "🫥 removed";
    return interaction === ObjectInteraction.NonInteractable ? "👁️ shown, not examinable" : "👁️ shown";
  },
};
