import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const restartScriptMeta: OpcodeMeta = {
  name: OpcodeName.RestartScript,
  hexcode: "0x1C",
  parameters: [] as const,
};
