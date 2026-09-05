import { musics } from "../data/music-data";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const musicMeta: OpcodeMeta = {
  name: OpcodeName.Music,
  hexcode: "0x09",
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
