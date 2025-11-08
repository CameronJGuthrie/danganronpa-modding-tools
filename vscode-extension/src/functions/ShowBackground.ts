import { FunctionName, LinscriptFunction } from "../enum/function";

export const showBackground: LinscriptFunction = {
  name: FunctionName.ShowBackground,
  opcode: "0x30",
  parameters: [
    {
      name: "backgroundId"
    },
    {
      name: "state"
    },
  ] as const,
  decorations: ([backgroundId, state]) => {
    return `BG ${backgroundId} @ ${state}`
  }
}