import { Unique } from "./unique";

type BaseInstruction = Unique<{
  functionName: string;
  description?: string;
}>;

type ArgumentMeta<T> = {
  name: string;
  value: T;
  description?: string;
};

type TextInstruction = BaseInstruction & {
  functionName: "Text";
  args: [ArgumentMeta<string>];
};

type NumberInstruction = BaseInstruction & {
  functionName: string;
  args: ArgumentMeta<number>[];
};

export type Instruction = TextInstruction | NumberInstruction;
