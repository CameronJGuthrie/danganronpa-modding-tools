import { LinscriptInstructionName, sounds } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const soundInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Sound,
  description: "Plays a sound effect by id at the given volume.",
  parameters: [
    {
      name: "sound",
      values: sounds,
    },
    {
      name: "volume",
      description: "Volume; omitted in source when it is the usual 100",
      defaultValue: 100,
    },
  ] as const,
  decorations([soundId, _volume]) {
    const soundName = sounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;

    if (soundId === 65535) {
      return `🔉 Sound Off 🚫`;
    }

    return `🔉 ${soundName}`;
  },
};
