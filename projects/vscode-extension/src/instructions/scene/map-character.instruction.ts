import { Bool, LinscriptInstructionName, MapCharacter, mapCharacterName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Source-only sugar for `MapState(room, character, 0|1)`: a character's place in the map roster. */
export const mapCharacterInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.MapCharacter,
  sugar: true,
  selfDescribing: true,
  description:
    "Marks a character as present in, or absent from, a room on the map roster that the Monopad map and the room scripts consult. The room is the number of the room's script (136 is the e01_008_136 room). Sugar for the hidden MapState(room, character, True|False) opcode.",
  parameters: [
    {
      name: "room",
      description: "The room's script number, e.g. 103 for Makoto's room",
    },
    {
      name: "character",
      description: "A student, or one of the unidentified MapCharacter_N ids (20 is probably Alter Ego)",
      names: MapCharacter,
    },
    {
      name: "present",
      names: Bool,
    },
  ] as const,
  decorations([room, character, present]) {
    const name = mapCharacterName(character) ?? `unknown character ${character}`;
    return present === Bool.True ? `🗺️ ${name} in room ${room}` : `🗺️ ${name} leaves room ${room}`;
  },
};
