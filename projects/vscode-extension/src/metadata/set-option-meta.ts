import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const setOptionMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.SetOption,
  hexcode: "0x2B",
  parameters: [
    {
      name: "option",
      description:
        "Menu option id: 1, 2, ... are the choices (named per script in Meta(), e.g. Option(1, Yes)), 18/19 (Exit_1/Exit_2) the back-out handlers, 255 closes the menu",
      scope: "Option",
    },
  ] as const,
};
