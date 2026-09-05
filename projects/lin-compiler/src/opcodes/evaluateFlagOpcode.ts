import type { SourceBuilder } from "../output.js";
import type { Script, ScriptEntry } from "../script.js";
import { BaseOpcode } from "./baseOpcode.js";
import { parseByteArg } from "./parseHelpers.js";

/**
 * Opcode 0x35 - EvaluateFlag
 * Format: byte byte byte count [variable bytes - flag checking logic]
 * The count byte and remaining bytes form a complex flag-checking structure.
 */
export class EvaluateFlagOpcode extends BaseOpcode {
  constructor() {
    super("EvaluateFlag");
    this.isVarArg = true;
  }

  override writeSourceArgs(output: SourceBuilder, script: Script, scriptEntry: ScriptEntry): void {
    const args = scriptEntry.args;
    if (args.length < 4) {
      // Shouldn't happen, but handle gracefully
      super.writeSourceArgs(output, script, scriptEntry);
      return;
    }

    // First 3 fixed bytes, the count byte, then all remaining bytes verbatim
    output.appendJoin(", ", args.map(String));
  }

  protected override parseOpcodeArgs(argsString: string, lineNum: number): number[] {
    const trimmed = argsString.trim();

    if (trimmed.length === 0) {
      throw new Error(`[read] error: EvaluateFlag requires at least 4 arguments at line ${lineNum + 1}`);
    }

    const argStrings = trimmed.split(",").map((arg) => arg.trim());

    if (argStrings.length < 4) {
      throw new Error(`[read] error: EvaluateFlag requires at least 4 arguments at line ${lineNum + 1}`);
    }

    // First 3 fixed bytes, the count byte, then remaining bytes (variable, per flag logic)
    return argStrings.map((arg, i) =>
      parseByteArg(arg, lineNum, i === 3 ? "invalid count value" : "invalid byte value"),
    );
  }
}
