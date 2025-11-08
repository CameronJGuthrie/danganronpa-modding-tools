import { sounds } from "../data/sound-data";
import { FunctionName, LinscriptFunction } from "../enum/function";

export const sound: LinscriptFunction = {
  name: FunctionName.Sound,
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
  decorations([soundId, volume]) {
    const soundName = sounds[soundId]?.name ?? `Unknown soundId: ${soundId}`;

    if (soundId === 65536) {
      return `🔉 Sound Off 🚫`; // This is a best guess
    }

    return `🔉 ${soundName}`;
  },
};
