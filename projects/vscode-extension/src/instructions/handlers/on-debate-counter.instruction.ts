import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateCounterInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateCounter,
  sugar: true,
  description:
    "Opens the handler that runs when statement k is hit with an absorbed statement (chapter 3 onwards); the partner statement is named in the nonstop_CC_NNN.dat record. Sugar for the hidden DebateLabel(20000 + k) opcode.",
  parameters: [
    {
      name: "statement",
      description: "Index of the statement in the debate, the record index in its nonstop_CC_NNN.dat",
      range: { min: 0, max: 9999 },
    },
  ] as const,
  decorations: ([statement]) => `---> counter on ${statement}`,
};
