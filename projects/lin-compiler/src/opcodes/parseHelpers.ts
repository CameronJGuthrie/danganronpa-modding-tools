import { FormatError, parseUnsigned } from "../parameter.ts";

export function parseByteArg(value: string, lineNum: number, message = "invalid byte value"): number {
  try {
    return parseUnsigned(value, 0xff);
  } catch (error) {
    if (error instanceof FormatError) {
      throw new Error(`[read] error: ${message} '${value}' at line ${lineNum + 1}`);
    }
    throw error;
  }
}

export function parseUInt16Arg(value: string, lineNum: number): number {
  try {
    return parseUnsigned(value, 0xffff);
  } catch (error) {
    if (error instanceof FormatError) {
      throw new Error(`[read] error: invalid 16-bit value '${value}' at line ${lineNum + 1}`);
    }
    throw error;
  }
}
