// TODO: this needs a better name

import { transitionSounds } from "../data/sound-data";
import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const soundBMeta: OpcodeMeta = {
  name: OpcodeName.SoundB,
  opcode: "0x0B",
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
