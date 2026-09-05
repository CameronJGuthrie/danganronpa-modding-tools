export enum ScriptType {
  Textless = 1,
  Text = 2,
}

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
