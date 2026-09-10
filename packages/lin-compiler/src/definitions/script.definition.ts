export const ScriptType = {
  Textless: 1,
  Text: 2,
} as const;

export type ScriptType = (typeof ScriptType)[keyof typeof ScriptType];

type ScriptEntryCommon = {
  opcode: number;
  args: number[];
};

type ScriptEntryText = ScriptEntryCommon & {
  text: string;
};

export type ScriptEntry = ScriptEntryCommon | ScriptEntryText;

export interface Script {
  entries: ScriptEntry[];
}
