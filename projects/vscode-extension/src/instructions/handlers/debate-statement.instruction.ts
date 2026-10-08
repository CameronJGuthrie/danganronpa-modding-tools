import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const debateStatementInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.DebateStatement,
  sugar: true,
  description:
    "Labels statement k of a Nonstop Debate in its statement script: the sprite, voice and text that follow are shown when the debate reaches it. Sugar for the hidden DebateLabel(k) opcode.",
  parameters: [
    {
      name: "statement",
      description: "Index of the statement in the debate, the record index in its nonstop_CC_NNN.dat",
      range: { min: 0, max: 9999 },
    },
  ] as const,
  decorations: ([statement]) => `---> statement ${statement}`,
};
