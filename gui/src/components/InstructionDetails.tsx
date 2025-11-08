import { Instruction } from "../types/instruction";

type InstructionDetailsProps = {
  instruction: Instruction;
};

export function InstructionDetails({ instruction }: InstructionDetailsProps) {
  return (
    <div>
      <h2>{instruction.functionName}</h2>
      <pre>{instruction.args.join(", ")}</pre>
    </div>
  );
}
