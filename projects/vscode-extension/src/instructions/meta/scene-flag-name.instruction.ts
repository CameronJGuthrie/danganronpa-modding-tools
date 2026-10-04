import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * `SceneFlagName(id, Name)` inside `Meta()`: names a slot of the `SceneFlags` flag group, the per-scene
 * scratch booleans every scene entry script resets, so the body can write
 * `SetFlag(SceneFlags, Name, True)` and `IfFlag(SceneFlags, Name, ...)`.
 */
export const sceneFlagNameInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.SceneFlagName,
  annotation: true,
  selfDescribing: true,
  description: "Names a SceneFlags slot for this script; used by SetFlag and IfFlag with the SceneFlags group.",
  parameters: [{ name: "slot" }, { name: "name" }] as const,
};
