import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateInfluenceEmptyInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateInfluenceEmpty,
  sugar: true,
  description:
    "Opens the handler that runs when the Influence gauge is empty; the scripts hide the debate with SetUI(31, 2) and run the chapter's game-over subroutine, scene 198. Sugar for the hidden DebateLabel(50000) opcode.",
  selfDescribing: true,
  parameters: [] as const,
  decorations: () => "---> influence empty",
};
