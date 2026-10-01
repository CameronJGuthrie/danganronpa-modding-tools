import { LinscriptInstructionName, musics } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const musicMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Music,
  hexcode: "0x09",
  description: "Starts a background music track with a fade-in in frames; id 255 stops the current track.",
  parameters: [
    {
      name: "musicId",
      values: musics,
    },
    {
      name: "volume",
      description: "Always 100",
    },
    {
      name: "fadeInTime",
      // Fade-in duration in frames (0 = instant start, common values: 60, 90, 120, 180)
      // When musicId is 255 (stop music), this parameter is typically 0
    },
  ] as const,
  decorations([musicId, _volume]) {
    if (musicId === 255) {
      return `🎵 Music Off 🚫`;
    }

    return [
      {
        contentText: `🎵 ${musics[musicId].name}`,
      },
    ];
  },
};
