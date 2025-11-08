import { FunctionName, LinscriptFunction } from "../enum/function";

export const checkCharacter: LinscriptFunction = {
  name: FunctionName.CheckCharacter,
  opcode: "0x27",
  parameters: [
    {
      name: "objectId",
    }
  ] as const,
  decorations([objectId]) {
    if (objectId === 254) {
      return "---> on Exit"
    }

    if (objectId === 255) {
      return "<---"
    }

    return `---> on ${objectId}`
  },
};
