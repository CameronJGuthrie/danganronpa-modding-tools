import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateLoopInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateLoop,
  sugar: true,
  description:
    "Opens the handler that runs when every statement has played without a hit and the debate starts over: Makoto's hint, vaguer on Mean logic difficulty. Sugar for the hidden DebateLabel(40000) opcode.",
  selfDescribing: true,
  parameters: [] as const,
  decorations: () => "---> debate looped",
};
