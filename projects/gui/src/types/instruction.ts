import type { Unique } from "./unique";

type BaseInstruction = Unique<{
  functionName: string;
  description?: string;
}>;

type TextInstruction = BaseInstruction & {
  functionName: "Text";
  args: [string];
};

type NumberInstruction = BaseInstruction & {
  functionName: string;
  args: number[];
};

export type Instruction = TextInstruction | NumberInstruction;
