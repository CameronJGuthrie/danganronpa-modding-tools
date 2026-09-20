import { LinscriptInstructionName, transitionSounds } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const soundBMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SoundB,
  hexcode: "0x0B",
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
