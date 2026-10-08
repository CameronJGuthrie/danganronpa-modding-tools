import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateTimeoutInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateTimeout,
  sugar: true,
  description:
    "Opens the handler that runs when the debate timer reaches zero; the scripts hide the debate with SetUI(31, 3) and run the chapter's game-over subroutine, scene 199. Sugar for the hidden DebateLabel(60000) opcode.",
  selfDescribing: true,
  parameters: [] as const,
  decorations: () => "---> time out",
};
