import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setOptionMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetOption,
  hexcode: "0x2B",
  parameters: [
    {
      name: "option",
      description:
        "Menu option id: 1/2 (Yes/No) are the choices, 18/19 (Exit_1/Exit_2) the back-out handlers, 255 closes the menu",
      scope: "Option",
    },
  ] as const,
};
