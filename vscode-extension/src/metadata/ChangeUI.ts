import { isUserInterface, userInterfaceConfiguration } from "../data/user-interface-data";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";
import { UserInterface } from "../enum/user-interface";

export const changeUi: OpcodeMeta = {
  name: OpcodeName.ChangeUI,
  opcode: "0x25",
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
