import { Bool, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Source-only sugar for `MapState(255, 0|1, 253)`. NOT TESTED IN GAME: the scripts write it the
 * moment the map is first unlocked and around each day of free movement, so toggling the map's
 * character icons is the most likely reading, not an observed effect.
 */
export const mapIconsInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.MapIcons,
  sugar: true,
  selfDescribing: true,
  description:
    "Toggles the character icons on the Monopad map (presumed; not yet tested in game). Written with True when a day of free movement begins and False when it ends. Sugar for the hidden MapState(255, True|False, 253) opcode.",
  parameters: [
    {
      name: "shown",
      names: Bool,
    },
  ] as const,
  decorations([shown]) {
    return shown === Bool.True ? "🗺️ Map icons on" : "🗺️ Map icons off";
  },
};
