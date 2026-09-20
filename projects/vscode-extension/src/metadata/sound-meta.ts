import { LinscriptInstructionName, sounds } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const soundMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Sound,
  hexcode: "0x0A",
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
