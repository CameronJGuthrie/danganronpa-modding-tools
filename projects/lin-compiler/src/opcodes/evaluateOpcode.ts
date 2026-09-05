import type { SourceBuilder } from "../output.ts";
import type { Script, ScriptEntry } from "../script.ts";
import { BaseOpcode } from "./baseOpcode.ts";
import { parseByteArg, parseUInt16Arg } from "./parseHelpers.ts";

/**
 * Opcode 0x36 - Evaluate
 * Variable-length opcode for operations/calculations.
 *
 * Byte layout: first expression is [UInt16BE, operand, UInt16BE] (5 bytes);
 * each additional expression is [joiner, UInt16BE, operand, UInt16BE] (6 bytes).
 */
export class EvaluateOpcode extends BaseOpcode {
  constructor() {
    super("Evaluate");
    this.isVarArg = true;
  }

  override writeSourceArgs(output: SourceBuilder, _script: Script, scriptEntry: ScriptEntry): void {
    const args = scriptEntry.args;
    if (args.length === 0) {
      return;
    }

    const argStrings: string[] = [];
    let i = 0;

    // First expression (5 bytes)
    if (i + 4 < args.length) {
      const value1 = (args[i] << 8) | args[i + 1];
      const operand = args[i + 2];
      const value2 = (args[i + 3] << 8) | args[i + 4];

      argStrings.push(String(value1), String(operand), String(value2));
      i += 5;
    }

    // Additional expressions (6 bytes each)
    while (i < args.length) {
      if (i + 5 < args.length) {
        const joiner = args[i];
        const value1 = (args[i + 1] << 8) | args[i + 2];
        const operand = args[i + 3];
        const value2 = (args[i + 4] << 8) | args[i + 5];

        argStrings.push(String(joiner), String(value1), String(operand), String(value2));
        i += 6;
      } else {
        // Shouldn't happen, but output remaining bytes as-is
        argStrings.push(String(args[i]));
        i++;
      }
    }

    output.appendJoin(", ", argStrings);
  }

  protected override parseOpcodeArgs(argsString: string, lineNum: number): number[] {
    const trimmed = argsString.trim();

    if (trimmed.length === 0) {
      return [];
    }

    const argStrings = trimmed.split(",").map((arg) => arg.trim());

    // First expression: 3 args (value1, operand, value2)
    // Additional expressions: 4 args each (joiner, value1, operand, value2)
    // Total: 3 + (n * 4) where n >= 0
    if (argStrings.length < 3 || (argStrings.length - 3) % 4 !== 0) {
      throw new Error(`[read] error: Evaluate expects 3 + (n * 4) arguments at line ${lineNum + 1}`);
    }

    const argBytes: number[] = [];
    let i = 0;

    // Parse first expression (3 args), writing 16-bit values big-endian
    const firstValue1 = parseUInt16Arg(argStrings[i], lineNum);
    const firstOperand = parseByteArg(argStrings[i + 1], lineNum, "invalid operand value");
    const firstValue2 = parseUInt16Arg(argStrings[i + 2], lineNum);

    argBytes.push(firstValue1 >> 8, firstValue1 & 0xff, firstOperand, firstValue2 >> 8, firstValue2 & 0xff);
    i += 3;

    // Parse additional expressions (4 args each)
    while (i < argStrings.length) {
      const joiner = parseByteArg(argStrings[i], lineNum, "invalid joiner value");
      const value1 = parseUInt16Arg(argStrings[i + 1], lineNum);
      const operand = parseByteArg(argStrings[i + 2], lineNum, "invalid operand value");
      const value2 = parseUInt16Arg(argStrings[i + 3], lineNum);

      argBytes.push(joiner, value1 >> 8, value1 & 0xff, operand, value2 >> 8, value2 & 0xff);
      i += 4;
    }

    return argBytes;
  }
}
