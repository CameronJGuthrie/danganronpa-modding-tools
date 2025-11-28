import { Filter, filterConfiguration, isFilter } from "../enum/filter";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const postProcessingEffect: OpcodeMeta = {
  name: OpcodeName.PostProcessingEffect,
  opcode: "0x04",
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
