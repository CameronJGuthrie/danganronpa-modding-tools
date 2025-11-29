import { sounds } from "../data/sound-data";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const soundMeta: OpcodeMeta = {
  name: OpcodeName.Sound,
  opcode: "0x0A",
  parameters: [
    {
      name: "sound",
      values: sounds,
    },
    {
      name: "volume",
    },
  ] as const,
  decorations([soundId, _volume]) {
    const soundName = sounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;

    if (soundId === 65536) {
      return `🔉 Sound Off 🚫`; // This is a best guess
    }

    return `🔉 ${soundName}`;
  },
};
