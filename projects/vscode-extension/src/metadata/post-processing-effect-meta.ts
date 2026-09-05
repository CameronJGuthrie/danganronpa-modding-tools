import { Filter, filterConfiguration, isFilter } from "../enum/filter";
import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const postProcessingEffectMeta: OpcodeMeta = {
  name: OpcodeName.PostProcessingEffect,
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
