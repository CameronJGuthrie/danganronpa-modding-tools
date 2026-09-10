import { Filter, filterConfiguration, isFilter, LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const postProcessingEffectMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.PostProcessingEffect,
  hexcode: "0x04",
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
