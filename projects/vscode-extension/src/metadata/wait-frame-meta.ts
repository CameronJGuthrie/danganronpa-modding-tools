import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitFrame() calls if you want.
 */
export const waitFrameMeta: OpcodeMeta = {
  name: OpcodeName.WaitFrame,
  hexcode: "0x3B",
  parameters: [] as const,
};
