import type { SourceBuilder } from "../output.ts";
import { ParamType } from "../parameter.ts";
import { type Script, type ScriptEntry, ScriptType } from "../script.ts";
import { BaseOpcode } from "./baseOpcode.ts";

export class TypeOpcode extends BaseOpcode {
  constructor(name: string, opcode = 0xff) {
    super(name, [ParamType.UInt16LE], opcode);
  }

  override readSource(argsString: string, lineNum: number, script: Script): ScriptEntry[] {
    // Parse the script type and set it on the script
    const value = argsString.trim();

    if (value.toLowerCase() === "textless") {
      script.type = ScriptType.Textless;
    } else if (value.toLowerCase() === "text") {
      script.type = ScriptType.Text;
    } else {
      throw new Error(`[read] error: Type opcode expects 'Textless' or 'Text' at line ${lineNum + 1}, got '${value}'`);
    }

    // 2-byte arg array, filled with the text count during PrepareForCompilation
    return [{ opcode: this.opcode, args: [0, 0] }];
  }

  override writeSourceArgs(output: SourceBuilder, script: Script, _scriptEntry: ScriptEntry): void {
    output.append(script.type === ScriptType.Textless ? "Textless" : "Text");
  }

  override prepareForCompilation(script: Script, entry: ScriptEntry): void {
    // Type opcode parameter is the text entry count (little-endian)
    const textCount = script.textEntries & 0xffff;
    entry.args[0] = textCount & 0xff;
    entry.args[1] = textCount >> 8;
  }
}
