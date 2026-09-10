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
