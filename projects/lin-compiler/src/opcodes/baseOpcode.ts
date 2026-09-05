import { options, toHexOpcode } from "../options.js";
import type { SourceBuilder } from "../output.js";
import { type ByteCursor, countBytes, formatValue, ParamType, parseValue } from "../parameter.js";
import type { Script, ScriptEntry } from "../script.js";

/** Shorthand for an opcode that takes `count` plain bytes. */
export function bytes(count: number): ParamType[] {
  return new Array(count).fill(ParamType.Byte);
}

export class BaseOpcode {
  /** Set when the opcode is registered in the dictionary. */
  opcode: number;
  readonly name: string | null;
  readonly paramTypes: ParamType[];
  isVarArg = false;

  constructor(name: string | null, paramTypes: ParamType[] | number = [], opcode = 0xff) {
    this.opcode = opcode;
    this.name = name;
    this.paramTypes = typeof paramTypes === "number" ? bytes(paramTypes) : paramTypes;
  }

  getByteCount(): number {
    return this.paramTypes.reduce((total, type) => total + countBytes(type), 0);
  }

  get displayName(): string {
    return this.name ?? toHexOpcode(this.opcode);
  }

  writeSource(output: SourceBuilder, script: Script, scriptEntry: ScriptEntry): void {
    output.append(options.useHexOpcodes ? toHexOpcode(this.opcode) : this.displayName);
    output.append("(");
    this.writeSourceArgs(output, script, scriptEntry);
    output.appendLine(")");
  }

  writeSourceArgs(output: SourceBuilder, _script: Script, scriptEntry: ScriptEntry): void {
    const argValues = scriptEntry.args;
    if (argValues.length === 0) {
      return;
    }

    const args: string[] = [];
    const cursor: ByteCursor = { index: 0 };
    const values = Uint8Array.from(argValues);

    for (const paramType of this.paramTypes) {
      args.push(formatValue(paramType, values, cursor));
    }
    output.appendJoin(", ", args);
  }

  readSource(argsString: string, lineNum: number, _script: Script): ScriptEntry[] {
    return [
      {
        opcode: this.opcode,
        args: this.parseOpcodeArgs(argsString, lineNum),
      },
    ];
  }

  protected parseOpcodeArgs(argsString: string, lineNum: number): number[] {
    const trimmed = argsString.trim();

    // Empty args
    if (trimmed.length === 0) {
      return [];
    }

    const argStrings = trimmed.split(",").map((arg) => arg.trim());

    // Convert arguments to bytes based on parameter types
    const argBytes: number[] = [];

    let argIndex = 0;
    for (const paramType of this.paramTypes) {
      if (argIndex >= argStrings.length) {
        throw new Error(`[read] error: not enough arguments at line ${lineNum + 1}`);
      }

      parseValue(paramType, argStrings[argIndex], argBytes, lineNum);
      argIndex++;
    }

    return argBytes;
  }

  /**
   * Called during compilation to prepare the entry for writing.
   * Override for opcodes that need special preparation (e.g. text ID assignment).
   */
  prepareForCompilation(_script: Script, _entry: ScriptEntry): void {
    // Default: no special preparation needed
  }
}
