import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically.
 * You may still insert extra WaitInput() calls if you want.
 *
 * TODO: the compiler does not seem to be removing all WaitInput() calls.
 * Either there are just extra ones in the game (no action required) or something may be wrong.
 */
export const waitInputMeta: OpcodeMeta = {
  name: OpcodeName.WaitInput,
  hexcode: "0x3A",
  parameters: [] as const,
};
