import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Source-only sugar for `MapState(255, 0, 254)`: empties the map roster before a new one is written. */
export const mapClearPositionsInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.MapClearPositions,
  sugar: true,
  selfDescribing: true,
  description:
    "Removes every character from every room on the map roster; written before a fresh set of MapCharacter lines or after everyone leaves. Sugar for the hidden MapState(255, 0, 254) opcode.",
  parameters: [] as const,
  decorations: () => "🗺️ Clear all positions",
};
