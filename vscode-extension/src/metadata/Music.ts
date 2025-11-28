import { musics } from "../data/music-data";
import { OpcodeName, OpcodeMeta } from "../enum/opcode";

export const music: OpcodeMeta = {
  name: OpcodeName.Music,
  opcode: "0x09",
  parameters: [
    {
      name: "musicId",
      values: musics,
    },
    {
      name: "volume",
      description: "Always 100"
    },
    {
      name: "fadeInTime",
      // Fade-in duration in frames (0 = instant start, common values: 60, 90, 120, 180)
      // When musicId is 255 (stop music), this parameter is typically 0
    },
  ] as const,
  decorations([musicId, volume]) {
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
