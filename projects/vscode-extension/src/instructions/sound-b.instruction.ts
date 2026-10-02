import { LinscriptInstructionName, transitionSounds } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const soundBInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.SoundB,
  description: "Plays a sound effect from the second sound bank (transition and UI sounds).",
  parameters: [
    {
      name: "soundId",
      values: transitionSounds,
    },
    {
      name: "volume",
      description: "Volume; every game script uses 100, so source normally omits it",
      defaultValue: 100,
    },
  ] as const,
  decorations([soundId, _volume]) {
    const soundName = transitionSounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;
    return `🔊 ${soundName}`;
  },
};
