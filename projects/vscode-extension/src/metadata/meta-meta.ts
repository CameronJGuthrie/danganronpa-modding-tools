import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * Opens the source-only block at the bottom of a file that holds per-script annotations such as
 * object names. It has no binary form: the compiler drops it.
 */
export const metaMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.Meta,
  hexcode: "",
  annotation: true,
  description: "Opens the block of per-script annotations (Object names) at the bottom of the file.",
  parameters: [] as const,
};
