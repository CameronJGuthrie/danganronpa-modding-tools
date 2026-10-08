import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateMissInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateMiss,
  sugar: true,
  description:
    "Opens the handler that runs when the player fires the wrong Truth Bullet at statement k: the speaker's retort and the Influence penalty. A label with no code falls through to the next one. Sugar for the hidden DebateLabel(k) opcode.",
  parameters: [
    {
      name: "statement",
      description: "Index of the statement in the debate, the record index in its nonstop_CC_NNN.dat",
      range: { min: 0, max: 9999 },
    },
  ] as const,
  decorations: ([statement]) => `---> miss on ${statement}`,
};
