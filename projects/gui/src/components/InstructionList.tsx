import { useCallback } from "react";
import { Instruction } from "../types/instruction";

type InstructionListProps = {
  instructions: Instruction[];
  selectedInstruction: Instruction | null;
  setSelectedInstruction: (instruction: Instruction) => void;
};

export function InstructionList({ instructions, selectedInstruction, setSelectedInstruction }: InstructionListProps) {
  return (
    <div className="flex flex-col">
      {instructions?.map((instruction, index) => (
        <InstructionItem
          key={instruction.id}
          instruction={instruction}
          lineNumber={formatLineNumber(index, instructions.length)}
          selected={instruction.id === selectedInstruction?.id}
          onSelect={setSelectedInstruction}
        />
      )) ?? "No script loaded"}
    </div>
  );
}

type InstructionProps = {
  instruction: Instruction;
  lineNumber: string;
  selected: boolean;
  onSelect: (self: Instruction) => void;
};

function InstructionItem({ instruction, lineNumber, selected, onSelect }: InstructionProps) {
  const handleClick = useCallback(() => {
    onSelect(instruction);
  }, [instruction, onSelect]);

  const backgroundColor = selected ? "bg-blue-300" : "bg-blue-100";

  return (
    <button className={`flex items-start gap-2 ${backgroundColor} cursor-default font-mono`} onClick={handleClick}>
      <span className="text-gray-500">{lineNumber}</span>
      <span className="text-left">
        {instruction.functionName}({instruction.args.join(", ")})
      </span>
    </button>
  );
}

function formatLineNumber(index: number, max: number) {
  return `${index + 1}`.padStart(max.toString().length, "0");
}
