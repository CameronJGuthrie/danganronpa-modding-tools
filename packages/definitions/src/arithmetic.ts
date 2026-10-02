export enum Arithmetic {
  Assign = 0,
  Add = 1,
  Subtract = 2,
}

const set = new Set(Object.values(Arithmetic).filter((x) => typeof x === "number"));

export const arithmaticConfiguraiton: Record<Arithmetic, { name: string }> = {
  [Arithmetic.Assign]: { name: "Assign" },
  [Arithmetic.Add]: { name: "Add" },
  [Arithmetic.Subtract]: { name: "Remove" },
};

export function isArithmetic(arithmetic: number): arithmetic is Arithmetic {
  return set.has(arithmetic);
}

/** The operator each arithmetic mode is written as in `.linscript`. */
export const arithmeticOperatorSymbols: Readonly<Record<Arithmetic, string>> = {
  [Arithmetic.Assign]: "=",
  [Arithmetic.Add]: "+=",
  [Arithmetic.Subtract]: "-=",
};

/**
 * Arithmetic modes as a name table for `.linscript`: symbol -> value and value -> symbol, the same
 * shape as a numeric enum object, so `SetVariable(Monocoin, +=, 5)` reads and writes like an
 * assignment statement.
 */
export const arithmeticOperators: Readonly<Record<string, string | number>> = Object.freeze({
  ...Object.fromEntries(Object.entries(arithmeticOperatorSymbols).map(([value, symbol]) => [symbol, Number(value)])),
  ...Object.fromEntries(Object.entries(arithmeticOperatorSymbols).map(([value, symbol]) => [Number(value), symbol])),
});
