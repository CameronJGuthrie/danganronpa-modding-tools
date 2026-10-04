import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Source-only sugar for `MapState(255, 0, 252)`. NOT TESTED IN GAME: the name is the most likely
 * reading of where the scripts write it (paired with MapIcons at every scene and day boundary,
 * right after the SceneFlags are reset), not an observed effect.
 */
export const mapClearCharacterStatusInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.MapClearCharacterStatus,
  sugar: true,
  selfDescribing: true,
  description:
    "Resets the per-character status the map keeps, such as who has been talked to today (presumed; not yet tested in game). Written at every scene and day boundary. Sugar for the hidden MapState(255, 0, 252) opcode.",
  parameters: [] as const,
  decorations: () => "🗺️ Reset character status",
};
