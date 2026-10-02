import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const returnMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Return,
  hexcode: "0x1C",
  description:
    "Ends the current script and resumes the caller at the instruction after its RunScript(...). Usually followed by StopScript(), which is not reached on this path.",
  parameters: [] as const,
};
