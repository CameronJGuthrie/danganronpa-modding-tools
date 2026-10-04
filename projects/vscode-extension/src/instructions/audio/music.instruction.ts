import { LinscriptInstructionName, Music, musics } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const musicInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Music,
  description:
    "Starts a background music track at a volume with a fade-in in frames; Stop (255) fades the current track out over the second argument's frames.",
  parameters: [
    {
      name: "musicId",
      names: Music,
      values: musics,
    },
    {
      name: "volume",
      description:
        "Volume (0-100, nearly always 100) when a track starts; the fade-out length in frames when the track is Stop",
      // The shipped scripts stop with 0, 60, 90, 120 or 180 frames (224 twice), so the volume range only applies to a start
      range: ([musicId]) => (musicId === Music.Stop ? undefined : { min: 0, max: 100 }),
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
