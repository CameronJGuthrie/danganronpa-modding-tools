import { ParameterType } from "./definitions/parameter.definition.ts";
import { SourceError } from "./errors.ts";

type ParameterProperties = {
  size: number;
  maxValue: number;
};

export const parameterProperties: Record<ParameterType, ParameterProperties> = {
  Byte: { size: 1, maxValue: 0xff },
  UInt16BE: { size: 2, maxValue: 0xffff },
  UInt16LE: { size: 2, maxValue: 0xffff },
};

/** Decode one value of `type` from `bytes`, starting at `offset`. */
export function decodeValue(type: ParameterType, bytes: ArrayLike<number>, offset: number): number {
  switch (type) {
    case ParameterType.Byte:
      return bytes[offset];
    case ParameterType.UInt16LE:
      return bytes[offset] | (bytes[offset + 1] << 8);
    case ParameterType.UInt16BE:
      return (bytes[offset] << 8) | bytes[offset + 1];
  }
}

/** Encode `value` as the bytes of `type`. */
export function encodeValue(type: ParameterType, value: number): number[] {
  switch (type) {
    case ParameterType.Byte:
      return [value & 0xff];
    case ParameterType.UInt16LE:
      return [value & 0xff, (value >> 8) & 0xff];
    case ParameterType.UInt16BE:
      return [(value >> 8) & 0xff, value & 0xff];
  }
}

const UNSIGNED_DECIMAL = /^\+?\d+$/;

/** Parse a decimal source argument into the bytes of `type`. */
export function parseArg(type: ParameterType, text: string, line: number): number[] {
  const trimmed = text.trim();
  if (!UNSIGNED_DECIMAL.test(trimmed) || Number(trimmed) > parameterProperties[type].maxValue) {
    throw new SourceError(line, `invalid ${type} argument '${text}'`);
  }
  return encodeValue(type, Number(trimmed));
}

/** Split a source argument list on commas. An empty or blank list yields no arguments. */
export function splitArgs(argsText: string): string[] {
  const trimmed = argsText.trim();
  return trimmed.length === 0 ? [] : trimmed.split(",").map((arg) => arg.trim());
}
