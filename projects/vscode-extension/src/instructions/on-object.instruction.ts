import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const onObjectInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnObject,
  description:
    "Opens the handler block that runs when the player examines a map object named with Object(id, Name) in Meta().",
  parameters: [
    {
      name: "objectId",
      scope: "Object",
    },
  ] as const,
  decorations([objectId]) {
    if (objectId === 254) {
      return "---> on Exit";
    }

    if (objectId === 255) {
      return "<---";
    }

    return `---> on ${objectId}`;
  },
};
