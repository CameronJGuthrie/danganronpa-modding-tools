/** Parameter encodings used by opcode arguments. */
export const ParamType = {
  /** 8-bit unsigned */
  Byte: "Byte",
  /** 16-bit unsigned, little-endian (LSB first, MSB second) */
  UInt16LE: "UInt16LE",
  /** 16-bit unsigned, big-endian (MSB first, LSB second) */
  UInt16BE: "UInt16BE",
} as const;
export type ParamType = (typeof ParamType)[keyof typeof ParamType];

/** Cursor into a byte array, so formatters can advance a shared read position. */
export interface ByteCursor {
  index: number;
}

export function countBytes(parameterType: ParamType): number {
  switch (parameterType) {
    case ParamType.Byte:
      return 1;
    case ParamType.UInt16LE:
    case ParamType.UInt16BE:
      return 2;
    default:
      throw new Error(`not implemented: ${parameterType}`);
  }
}

/** Format a parameter value from bytes to string for decompilation. */
export function formatValue(parameterType: ParamType, bytes: Uint8Array, cursor: ByteCursor): string {
  switch (parameterType) {
    case ParamType.Byte:
      return String(bytes[cursor.index++]);
    case ParamType.UInt16LE: {
      // Little-endian: LSB first, MSB second
      const value = bytes[cursor.index] | (bytes[cursor.index + 1] << 8);
      cursor.index += 2;
      return String(value);
    }
    case ParamType.UInt16BE: {
      // Big-endian: MSB first, LSB second
      const value = (bytes[cursor.index] << 8) | bytes[cursor.index + 1];
      cursor.index += 2;
      return String(value);
    }
    default:
      throw new Error(`not implemented: ${parameterType}`);
  }
}

/** Parse an unsigned integer, rejecting anything the C# `Parse` overloads would reject. */
export function parseUnsigned(stringValue: string, max: number): number {
  const trimmed = stringValue.trim();
  if (!/^\+?\d+$/.test(trimmed)) {
    throw new FormatError(stringValue);
  }
  const value = Number(trimmed);
  if (value > max) {
    throw new FormatError(stringValue);
  }
  return value;
}

/** Thrown for malformed numeric arguments; callers turn it into a line-annotated error. */
export class FormatError extends Error {
  readonly value: string;

  constructor(value: string) {
    super(`invalid numeric value '${value}'`);
    this.value = value;
    this.name = "FormatError";
  }
}

/** Parse a parameter value from string to bytes for compilation. */
export function parseValue(
  parameterType: ParamType,
  stringValue: string,
  outputBytes: number[],
  lineNum: number,
): void {
  try {
    switch (parameterType) {
      case ParamType.Byte:
        outputBytes.push(parseUnsigned(stringValue, 0xff));
        break;
      case ParamType.UInt16LE: {
        const value = parseUnsigned(stringValue, 0xffff);
        // Little-endian: LSB first, MSB second
        outputBytes.push(value & 0xff, value >> 8);
        break;
      }
      case ParamType.UInt16BE: {
        const value = parseUnsigned(stringValue, 0xffff);
        // Big-endian: MSB first, LSB second
        outputBytes.push(value >> 8, value & 0xff);
        break;
      }
      default:
        throw new Error(`not implemented: ${parameterType}`);
    }
  } catch (error) {
    if (error instanceof FormatError) {
      throw new Error(`[read] error: invalid argument '${stringValue}' at line ${lineNum + 1}`);
    }
    throw error;
  }
}
