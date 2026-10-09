import {
  ChooseOptionMenu,
  isUserInterface,
  LinscriptInstructionName,
  UiVisibility,
  uiModeNamesByUserInterface,
  UserInterface,
  userInterfaceConfiguration,
} from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

export const setUiInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.SetUI,
  description: "Shows or hides a user-interface element such as the textbox, HUD or rumble effect.",
  selfDescribing: true,
  parameters: [
    {
      name: "interfaceId",
      names: UserInterface,
      values: UserInterface,
    },
    {
      name: "state",
      namesBy: { argument: -1, tables: uiModeNamesByUserInterface, otherwise: UiVisibility },
      description:
        "Hidden or Shown; some interfaces accept larger numeric modes. For ChooseOption the byte is the menu style: TopicList, TwoChoice, YesNo or Wide",
    },
  ] as const,
  decorations([interfaceId, state]) {
    if (interfaceId === UserInterface.ChooseOption) {
      const style = (ChooseOptionMenu as Record<number, string | number | undefined>)[state];
      const action =
        state === ChooseOptionMenu.Hidden ? "Close" : typeof style === "string" ? `Open ${style}` : `Open mode ${state}`;
      return [{ contentText: `${action} menu: ${userInterfaceConfiguration[interfaceId]}` }];
    }
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
