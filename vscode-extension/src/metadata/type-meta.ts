import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

/**
 * This is no longer used by the .linscript format as the compiler can infer this.
 */
export const typeMeta: OpcodeMeta = {
  name: OpcodeName.Type,
  hexcode: "0x00",
  parameters: [
    {
      name: "type",
      values: {
        1: "Textless",
        2: "Text",
      },
    },
  ] as const,
};
