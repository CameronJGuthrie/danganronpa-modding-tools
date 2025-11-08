import { backgrounds } from "../data/background-data";
import { FunctionName, LinscriptFunction } from "../enum/function";

export const animation: LinscriptFunction = {
  name: FunctionName.Animation,
  opcode: "0x06",
  parameters: [
    {
      name: "backgroundId",
      values: backgrounds,
    },
    {
      name: "",
      unknown: true,
    },
    {
      name: "",
      unknown: true,
    },
    {
      name: "",
      unknown: true,
    },
    {
      name: "",
      unknown: true,
    },
    {
      name: "",
      unknown: true,
    },
    {
      name: "",
      unknown: true,
    },
  ] as const,
  decorations([backgroundId, _2, _3, _4, _5, _6, _7]) {
    return [{ contentText: `🏔️ ${backgrounds?.[backgroundId] ?? backgroundId}` }]
  },
};
