import { LinscriptInstructionName, UiVisibility, UserInterface } from "linscript-definitions";
import { isUserInterface, userInterfaceConfiguration } from "../data/user-interface-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setUiMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetUI,
  hexcode: "0x25",
  parameters: [
    {
      name: "interfaceId",
      values: UserInterface,
    },
    {
      name: "state",
      names: UiVisibility,
      values: {
        [UiVisibility.Hidden]: "Hidden",
        [UiVisibility.Shown]: "Shown",
      },
      description: "Hidden or Shown; some interfaces accept larger numeric modes",
    },
  ] as const,
  decorations([interfaceId, state]) {
    const visibility = state === UiVisibility.Hidden ? "Hide" : state === UiVisibility.Shown ? "Show" : `Mode ${state}`;
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
