// TODO: this needs a better name

import { transitionSounds } from "../data/sound-data";
import { FunctionName, LinscriptFunction } from "../enum/function";

export const soundB: LinscriptFunction = {
  name: FunctionName.SoundB,
  opcode: "0x0B",
  parameters: [
    {
      name: "soundId",
      values: transitionSounds
    },
    {
      name: "volume",
      description: "volume is always 100"
    }
  ] as const,
  decorations([soundId, volume]) {
    const soundName = transitionSounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;
    return `🔊 ${soundName}`;
  },
}

