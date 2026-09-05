export const ScriptType = {
  Textless: 1,
  Text: 2,
} as const;
export type ScriptType = (typeof ScriptType)[keyof typeof ScriptType];

/** One opcode invocation. `args` holds the raw argument bytes; `text` is set only on Text entries. */
export interface ScriptEntry {
  opcode: number;
  args: number[];
  text?: string;
}

export interface Script {
  entries: ScriptEntry[];
}
