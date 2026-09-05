import { SourceError } from "./errors.ts";

/** Encodings an opcode argument can have in the compiled script. */
export const ParamType = {
  /** 8-bit unsigned */
  Byte: "Byte",
  /** 16-bit unsigned, little-endian (LSB first, MSB second) */
  UInt16LE: "UInt16LE",
  /** 16-bit unsigned, big-endian (MSB first, LSB second) */
  UInt16BE: "UInt16BE",
} as const;
export type ParamType = (typeof ParamType)[keyof typeof ParamType];

export function byteSize(type: ParamType): number {
  return type === ParamType.Byte ? 1 : 2;
}

function maxValue(type: ParamType): number {
  return type === ParamType.Byte ? 0xff : 0xffff;
}

/** Decode one value of `type` from `bytes`, starting at `offset`. */
export function decodeValue(type: ParamType, bytes: ArrayLike<number>, offset: number): number {
  switch (type) {
    case ParamType.Byte:
      return bytes[offset];
    case ParamType.UInt16LE:
      return bytes[offset] | (bytes[offset + 1] << 8);
    case ParamType.UInt16BE:
      return (bytes[offset] << 8) | bytes[offset + 1];
  }
}

/** Encode `value` as the bytes of `type`. */
export function encodeValue(type: ParamType, value: number): number[] {
  switch (type) {
    case ParamType.Byte:
      return [value & 0xff];
    case ParamType.UInt16LE:
      return [value & 0xff, (value >> 8) & 0xff];
    case ParamType.UInt16BE:
      return [(value >> 8) & 0xff, value & 0xff];
  }
}

const UNSIGNED_DECIMAL = /^\+?\d+$/;

/** Parse a decimal source argument into the bytes of `type`. */
export function parseArg(type: ParamType, text: string, line: number): number[] {
  const trimmed = text.trim();
  if (!UNSIGNED_DECIMAL.test(trimmed) || Number(trimmed) > maxValue(type)) {
    throw new SourceError(line, `invalid ${type} argument '${text}'`);
  }
  return encodeValue(type, Number(trimmed));
}

/** Split a source argument list on commas. An empty or blank list yields no arguments. */
export function splitArgs(argsText: string): string[] {
  const trimmed = argsText.trim();
  return trimmed.length === 0 ? [] : trimmed.split(",").map((arg) => arg.trim());
}
