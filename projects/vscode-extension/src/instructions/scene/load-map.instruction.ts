import { LinscriptInstructionName, Room, roomDisplayName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const loadMapInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.LoadMap,
  description:
    "Loads a room (map area) for exploration, e.g. LoadMap(DormHallway, 1, 255). The room is the id in the third group of the room's script name; the other two arguments are not yet understood, the third is usually 255.",
  parameters: [
    {
      name: "room",
      description: "A Room name, or the number for rooms whose location is not yet certain",
      names: Room,
    },
    {
      unknown: true,
    },
    {
      unknown: true,
    },
  ] as const,
  decorations([room]) {
    const name = roomDisplayName(room);
    return name === undefined ? `🚪 Unknown room ${room}` : `🚪 ${name}`;
  },
};
