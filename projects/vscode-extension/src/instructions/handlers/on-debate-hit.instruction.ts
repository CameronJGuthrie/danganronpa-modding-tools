import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/** Sugar for the hidden DebateLabel opcode, a case label of the Nonstop Debate engine (see opcodes/debate.ts in lin-compiler). */
export const onDebateHitInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.OnDebateHit,
  sugar: true,
  description:
    "Opens the handler that runs when the right Truth Bullet hits statement k, which is the bullet the statement's nonstop_CC_NNN.dat record names. Sugar for the hidden DebateLabel(10000 + k) opcode.",
  parameters: [
    {
      name: "statement",
      description: "Index of the statement in the debate, the record index in its nonstop_CC_NNN.dat",
      range: { min: 0, max: 9999 },
    },
  ] as const,
  decorations: ([statement]) => `---> hit on ${statement}`,
};
