export const ScriptType = {
  Textless: 1,
  Text: 2,
} as const;
export type ScriptType = (typeof ScriptType)[keyof typeof ScriptType];

export interface ScriptEntry {
  opcode: number;
  args: number[];
  text?: string | null;
}

export class Script {
  file: Uint8Array = new Uint8Array(0);
  type: ScriptType = ScriptType.Textless;
  headerSize = 0;
  fileSize = 0;
  textBlockPos = 0;
  scriptData: ScriptEntry[] = [];
  textEntries = 0;
}
