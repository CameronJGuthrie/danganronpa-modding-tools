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

/**
 * A numeric TypeScript enum object (or any similar table) mapping names to values and values back
 * to names, e.g. `Character` from `linscript-definitions`.
 */
export type NamedValues = Readonly<Record<string, string | number>>;

/**
 * One argument slot in a layout: either a bare encoding, or an encoding whose values have names.
 * Named slots are written by name in `.linscript` when the value is known, and accept either the
 * name or the number on compile.
 */
export type Parameter = ParameterType | { readonly type: ParameterType; readonly names: NamedValues };

export function parameterTypeOf(parameter: Parameter): ParameterType {
  return typeof parameter === "string" ? parameter : parameter.type;
}

/** The name for `value` in `names`, if it has one. */
export function nameOfValue(names: NamedValues, value: number): string | undefined {
  const name = names[value];
  return typeof name === "string" ? name : undefined;
}

/** The value for `name` in `names`, if it is one of the names. */
export function valueOfName(names: NamedValues, name: string): number | undefined {
  const value = Object.hasOwn(names, name) ? names[name] : undefined;
  return typeof value === "number" ? value : undefined;
}
