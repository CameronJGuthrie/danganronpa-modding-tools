import { OpcodeName, OpcodeMeta } from "../enum/opcode";

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

export const screenFade: OpcodeMeta = {
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
