import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Source-only sugar for `MapState(255, 0, 255)`: the full reset, used three times in the game. */
export const mapClearAllInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.MapClearAll,
  sugar: true,
  selfDescribing: true,
  description:
    "Resets every map table at once, standing in for MapClearCharacterStatus, MapIcons and MapClearPositions; the game uses it only three times. Sugar for the hidden MapState(255, 0, 255) opcode.",
  parameters: [] as const,
  decorations: () => "🗺️ Reset map",
};
