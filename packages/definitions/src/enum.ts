/**
 * Builds a numeric enum as a plain object so the package needs no build step: Node's type
 * stripping cannot run `enum`, and consumers typecheck with `erasableSyntaxOnly`.
 *
 * The result has the same shape as a TypeScript numeric enum object: each member name maps to its
 * value and each value maps back to its name, so `Character.Makoto === 0`, `Character[0] === "Makoto"`
 * and `Object.values(Character).filter((v) => typeof v === "number")` all keep working.
 *
 * @example
 * export const Bool = defineEnum({ False: 0, True: 1 });
 * export type Bool = EnumValue<typeof Bool>;
 */
export function defineEnum<const T extends Record<string, number>>(members: T): EnumObject<T> {
  const table: Record<string | number, string | number> = { ...members };
  for (const [name, value] of Object.entries(members)) {
    table[value] = name;
  }
  return Object.freeze(table) as EnumObject<T>;
}

/** A numeric enum object: the members plus their reverse mapping from value to name. */
export type EnumObject<T extends Record<string, number>> = Readonly<T> & {
  readonly [K in keyof T as T[K]]: K;
};

/** The union of an enum object's numeric values, used as the type of the same name as the enum. */
export type EnumValue<E> = Extract<E[keyof E], number>;
