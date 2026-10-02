import { Filter, filterConfiguration, isFilter, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const postProcessingEffectInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.PostProcessingEffect,
  description:
    "Applies a full-screen filter such as a blur or colour effect. The other arguments are not yet understood.",
  parameters: [
    {
      unknown: true,
    },
    {
      name: "filter",
      values: Filter,
    },
    {
      unknown: true,
      // always 0
    },
    {
      unknown: true,
      // always 0
    },
  ] as const,
  decorations: ([_1, filter, _3, _4]) => {
    if (!isFilter(filter)) {
      return [{ contentText: `Unknown filter: ${filter}` }];
    }
    return [{ contentText: `${filterConfiguration[filter]} filter` }];
  },
};
