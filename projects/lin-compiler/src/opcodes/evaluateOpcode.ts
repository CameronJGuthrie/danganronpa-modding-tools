import { SourceError } from "../errors.ts";
import { ParamType, splitArgs } from "../parameter.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BaseOpcode, formatByLayout, formatRawBytes, parseByLayout } from "./baseOpcode.ts";

const { Byte, UInt16BE } = ParamType;

/** `value1, operand, value2` */
const FIRST_EXPRESSION: readonly ParamType[] = [UInt16BE, Byte, UInt16BE];
/** `joiner, value1, operand, value2` */
const CHAINED_EXPRESSION: readonly ParamType[] = [Byte, UInt16BE, Byte, UInt16BE];

const FIRST_BYTES = 5;
const CHAINED_BYTES = 6;

/**
 * Opcode 0x36 - Evaluate. A variable-length chain of comparisons: the first expression is
 * 5 bytes and each further expression adds a 1-byte joiner in front, for 6 bytes.
 */
export class EvaluateOpcode extends BaseOpcode {
  constructor(id: number, name: string) {
    super(id, name, [], true);
  }

  override formatArgs(entry: ScriptEntry): string {
    const chained = entry.args.length - FIRST_BYTES;
    if (chained < 0 || chained % CHAINED_BYTES !== 0) {
      return formatRawBytes(entry.args);
    }
    return formatByLayout(chainLayout(chained / CHAINED_BYTES), entry.args);
  }

  protected override parseArgs(argsText: string, line: number): number[] {
    const values = splitArgs(argsText);
    const chained = values.length - FIRST_EXPRESSION.length;
    if (chained < 0 || chained % CHAINED_EXPRESSION.length !== 0) {
      throw new SourceError(line, `${this.name} expects 3 + 4n arguments, got ${values.length}`);
    }
    return parseByLayout(chainLayout(chained / CHAINED_EXPRESSION.length), values, line);
  }
}

/** Parameter layout of a first expression followed by `chainedCount` chained expressions. */
function chainLayout(chainedCount: number): ParamType[] {
  const layout = [...FIRST_EXPRESSION];
  for (let i = 0; i < chainedCount; i++) {
    layout.push(...CHAINED_EXPRESSION);
  }
  return layout;
}
