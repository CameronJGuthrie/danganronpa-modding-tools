/** Encodings an opcode argument can have in the compiled script. */
export const ParameterType = {
  /** 8-bit unsigned */
  Byte: "Byte",
  /** 16-bit unsigned, little-endian (LSB first, MSB second) */
  UInt16LE: "UInt16LE",
  /** 16-bit unsigned, big-endian (MSB first, LSB second) */
  UInt16BE: "UInt16BE",
} as const;
export type ParameterType = (typeof ParameterType)[keyof typeof ParameterType];
