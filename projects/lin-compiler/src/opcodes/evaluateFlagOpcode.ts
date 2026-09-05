import { SourceError } from "../errors.ts";
import { ParamType, parseArg, splitArgs } from "../parameter.ts";
import type { ScriptEntry } from "../script.ts";
import { BaseOpcode, formatRawBytes } from "./baseOpcode.ts";

const MIN_ARGS = 4;

/**
 * Opcode 0x35 - EvaluateFlag. Three fixed bytes, a count byte, then a variable number of
 * flag-check bytes whose structure is not yet understood, so every byte is shown verbatim.
 */
export class EvaluateFlagOpcode extends BaseOpcode {
  constructor(id: number, name: string) {
    super(id, name, [], true);
  }

  override formatArgs(entry: ScriptEntry): string {
    return formatRawBytes(entry.args);
  }

  protected override parseArgs(argsText: string, line: number): number[] {
    const values = splitArgs(argsText);
    if (values.length < MIN_ARGS) {
      throw new SourceError(line, `${this.name} expects at least ${MIN_ARGS} arguments, got ${values.length}`);
    }
    return values.flatMap((value) => parseArg(ParamType.Byte, value, line));
  }
}
