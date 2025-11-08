

/**
 * Maps a specific property from each value in a record to a new record with { name: value } objects.
 *
 * @example
 * const input = { 1: { color: "red", size: "large" }, 2: { color: "blue", size: "small" } }
 * const result = mapProperty(input, "color")
 * // result: { 1: { name: "red" }, 2: { name: "blue" } }
 */
export function mapProperty<N extends string | number, T extends string>(
  // The input map, e.g. { 1: { color: "red" }, 2: { color: "blue" }}
  input: Record<N, { [key in T]: string }>,
  // The key desired, e.g. "color"
  key: T
): Record<N, { name: string }> {
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [
      k,
      { name: (v as Record<T, string>)[key] }
    ])
  ) as Record<N, { name: string }>;
}

export function flatMapProperty<N extends string | number, T extends string>(
  // The input map, e.g. { 1: { color: "red" }, 2: { color: "blue" }}
  input: Record<N, { [key in T]: string }>,
  // The key desired, e.g. "color"
  key: T
): Record<N, string> {
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [
      k,
      (v as Record<T, string>)[key]
    ])
  ) as Record<N, string>;
}