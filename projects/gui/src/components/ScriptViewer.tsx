import { useCallback, useMemo, useState } from "react";
import { useFile } from "../hooks/useFile";
import { Instruction } from "../types/instruction";
import { uid } from "../util/uid";
import { InstructionList } from "./InstructionList";

export function ScriptViewer() {
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null);
  const [scriptFilePath, setScriptFilePath] = useState<string | null>(null);
  const script = useFile(scriptFilePath, "utf-16le");

  const instructions = useMemo<Instruction[]>(() => {
    if (!script) {
      return [];
    }
    return createInstructions(script);
  }, [script]);

  const onChooseScript = useCallback(() => {
    window.electron.openFileDialog().then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        setScriptFilePath(result.filePaths[0]);
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-start bg-slate-100 p-4 gap-4">
      <button onClick={onChooseScript} className="bg-slate-400 p-2">
        Choose Script
      </button>

      <InstructionList
        instructions={instructions}
        selectedInstruction={selectedInstruction}
        setSelectedInstruction={setSelectedInstruction}
      />
    </div>
  );
}

function createInstructions(script: string): Instruction[] {
  const lines = script.split("\n").filter((line) => line.trim() !== "");

  return lines.map(mapInstruction);
}

function mapInstruction(line: string): Instruction {
  const match = line.match(/(\w+)\((.*)\)/);

  if (!match) {
    throw new Error(`Invalid instruction: ${line}`);
  }

  const functionName = match[1];

  if (functionName === "Text") {
    return {
      id: uid(),
      functionName,
      args: [match[2]],
    };
  }

  let args: number[] = [];
  if (match[2]) {
    args = match[2].split(",").map((arg) => parseInt(arg));
  }

  return {
    id: uid(),
    functionName,
    args,
  };
}
