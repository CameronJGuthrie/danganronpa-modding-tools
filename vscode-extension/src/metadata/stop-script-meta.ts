import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const stopScriptMeta: OpcodeMeta = {
  name: OpcodeName.StopScript,
  hexcode: "0x1A",
  parameters: [] as const,
};
