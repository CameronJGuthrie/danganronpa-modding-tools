import { SourceError } from "../errors.ts";
import { ParamType } from "../parameter.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BaseOpcode } from "./baseOpcode.ts";

/**
 * Opcode 0x00 - Type. Its argument is the text entry count, which the compiler computes itself,
 * so the decompiler omits the opcode and the compiler synthesises it. It is still accepted in
 * source as `Type(Text)` / `Type(Textless)` for compatibility with older scripts.
 */
export class TypeOpcode extends BaseOpcode {
  constructor(id: number, name: string) {
    super(id, name, [ParamType.UInt16LE]);
  }

  override parseSource(argsText: string, line: number): ScriptEntry[] {
    const value = argsText.trim().toLowerCase();
    if (value !== "textless" && value !== "text") {
      throw new SourceError(line, `${this.name} expects 'Textless' or 'Text', got '${argsText.trim()}'`);
    }
    return [{ opcode: this.id, args: [0, 0] }];
  }
}
