import { LinscriptInstructionName, UserInterface } from "linscript-definitions";
import { isUserInterface, userInterfaceConfiguration } from "../data/user-interface-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const changeUiMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.ChangeUI,
  hexcode: "0x25",
  parameters: [
    {
      name: "interfaceId",
      values: UserInterface,
    },
    {
      name: "visible",
      values: {
        0: "false",
        1: "true",
      },
    },
  ] as const,
  decorations([interfaceId, visible]) {
    const visibility = visible ? "Show" : "Hide";
    if (!isUserInterface(interfaceId)) {
      return [{ contentText: `${visibility} UI: ${interfaceId}` }];
    }
    return [
      {
        contentText: `${visibility} UI: ${userInterfaceConfiguration[interfaceId]}`,
      },
    ];
  },
};
