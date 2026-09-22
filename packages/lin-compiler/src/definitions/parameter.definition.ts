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
export type Parameter =
  | ParameterType
  | { readonly type: ParameterType; readonly names: NamedValues }
  | DependentParameter
  | ScopedParameter
  | OptionalParameter;

/**
 * A slot that source may leave out, e.g. the volume byte of `Voice`, which is 100 in every game
 * script. The compiler fills in `defaultValue` when the argument is absent and the decompiler
 * omits the argument when it holds that value. Optional slots must come last in their layout.
 */
export type OptionalParameter = {
  readonly type: ParameterType;
  readonly defaultValue: number;
};

export function isOptional(parameter: Parameter): parameter is OptionalParameter {
  return typeof parameter !== "string" && "defaultValue" in parameter;
}

/**
 * Name tables that are not fixed by the opcode table but supplied per script, e.g. the object and
 * character names a `.linscript` file declares in its `Meta()` block.
 */
export type ParameterScope = "Object" | "Option" | "Character";

/** A slot whose names come from the script being read or written (see `ParameterScope`). */
export type ScopedParameter = {
  readonly type: ParameterType;
  readonly scope: ParameterScope;
};

/** The name tables in effect for each scope while reading or writing one script. */
export type ScopeTables = Partial<Readonly<Record<ParameterScope, NamedValues>>>;

/**
 * A slot whose name table depends on the value of an earlier slot in the same layout, e.g. the
 * flag offset of `SetFlag` is a character id only when the flag group is a character group.
 * `dependsOn` is relative (-1 is the previous slot) so it also works inside repeated layouts.
 */
export type DependentParameter = {
  readonly type: ParameterType;
  readonly dependsOn: number;
  readonly namesBy: Readonly<Record<number, NamedValues>>;
};

export function parameterTypeOf(parameter: Parameter): ParameterType {
  return typeof parameter === "string" ? parameter : parameter.type;
}

/**
 * The name table that applies to `parameter` at `index`, given the values decoded so far and the
 * script's scoped tables.
 */
export function namesFor(
  parameter: Parameter,
  index: number,
  values: readonly (number | undefined)[],
  scopes: ScopeTables = {},
): NamedValues | undefined {
  if (typeof parameter === "string") {
    return undefined;
  }
  if ("names" in parameter) {
    return parameter.names;
  }
  if ("scope" in parameter) {
    return scopes[parameter.scope];
  }
  if ("defaultValue" in parameter) {
    return undefined;
  }
  const controlling = values[index + parameter.dependsOn];
  return controlling === undefined ? undefined : parameter.namesBy[controlling];
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
