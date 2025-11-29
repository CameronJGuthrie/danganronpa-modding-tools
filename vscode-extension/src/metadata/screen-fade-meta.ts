import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

const overlays: { [color: number]: string } = {
  0: "loading",
  1: "solid black",
  2: "solid white",
  3: "solid red",
};

const types: { [type: number]: string } = {
  0: "Hide",
  1: "Show",
  101: "Block with", // Special? This seems to stop you from interacting with the game until the loading screen is cleared
};

export const screenFadeMeta: OpcodeMeta = {
  name: OpcodeName.ScreenFade,
  opcode: "0x22",
  parameters: [
    {
      name: "type",
      values: types,
    },
    {
      name: "overlay",
      values: overlays,
    },
    {
      name: "frames",
    },
  ] as const,
  decorations([type, overlay, frames]) {
    return `${types[type]} ${overlays[overlay]} overlay over ${(frames / 60).toFixed(2)}s`;
  },
};
