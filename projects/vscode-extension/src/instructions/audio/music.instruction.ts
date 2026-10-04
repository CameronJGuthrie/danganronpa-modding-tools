import { LinscriptInstructionName, Music, musics } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const musicInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Music,
  description: "Starts a background music track with a fade-in in frames; id 255 stops the current track.",
  parameters: [
    {
      name: "musicId",
      names: Music,
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
    if (musicId === Music.Stop) {
      return `🎵 Music Off 🚫`;
    }

    const name = musics[musicId]?.name;
    return [{ contentText: name === undefined ? `🎵 Unknown music ${musicId}` : `🎵 ${name}` }];
  },
};
