import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const debateEndInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.DebateEnd,
  sugar: true,
  description:
    "Closes a Nonstop Debate statement list or handler table; the lines after it run normally. Sugar for the hidden DebateLabel(65535) opcode.",
  selfDescribing: true,
  parameters: [] as const,
  decorations: () => "<--- end of debate",
};
