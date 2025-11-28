import { OpcodeName, OpcodeMeta } from "../enum/opcode";

import { music as musicMap } from "../data/music-data";

export const music: OpcodeMeta = {
  name: OpcodeName.Music,
  opcode: "0x09",
  parameters: [
    {
      name: "musicId",
      values: musicMap,
    },
    {
      name: "volume",
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
        contentText: `🎵 ${musicMap[musicId].name}`,
      },
    ];
  },
};
