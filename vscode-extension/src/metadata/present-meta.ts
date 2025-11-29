import { isPresent, Present, presentConfiguration } from "../data/present-data";
import { Arithmetic, arithmaticConfiguraiton, isArithmetic } from "../enum/arithmetic";
import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

export const presentMeta: OpcodeMeta = {
  name: OpcodeName.Present,
  opcode: "0x0D",
  parameters: [
    {
      name: "presentId",
      values: Present,
    },
    {
      name: "operation",
      values: Arithmetic,
    },
    {
      name: "quantity",
      description: "this may not be used, it is always 1",
    },
  ] as const,
  decorations: ([present, mode, quantity]) => {
    if (!isPresent(present)) {
      return [{ contentText: `Invalid present: ${present}` }];
    }
    if (!isArithmetic(mode)) {
      return [{ contentText: `Invalid mode: ${mode}` }];
    }

    const { name: operation } = arithmaticConfiguraiton[mode];
    const { name: itemName } = presentConfiguration[present];

    return [{ contentText: `📦 ${operation} ${quantity}x ${itemName}` }];
  },
};
