import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Opens the source-only block at the bottom of a file that holds per-script annotations such as
 * object names. It has no binary form: the compiler drops it.
 */
export const metaInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Meta,
  annotation: true,
  description:
    "Opens the block of per-script annotations (Object, Character, Option and LabelName entries) at the bottom of the file.",
  parameters: [] as const,
};
