import { LinscriptInstructionName } from "linscript-definitions";
import { transitionSounds } from "../data/sound-data";
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
      description: "volume is always 100",
    },
  ] as const,
  decorations([soundId, _volume]) {
    const soundName = transitionSounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;
    return `🔊 ${soundName}`;
  },
};
