import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateUnknownInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateUnknown,
  sugar: true,
  description:
    "A handler kind the shipped scripts list for every statement but never give code of its own, so its trigger is unknown. Sugar for the hidden DebateLabel(30000 + k) opcode.",
  parameters: [
    {
      name: "statement",
      description: "Index of the statement in the debate, the record index in its nonstop_CC_NNN.dat",
      range: { min: 0, max: 9999 },
    },
  ] as const,
  decorations: ([statement]) => `---> unknown on ${statement}`,
};
