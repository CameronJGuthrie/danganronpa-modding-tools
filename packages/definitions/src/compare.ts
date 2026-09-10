export enum Compare {
  NotEqual = 0,
  Equal = 1,
  LessOrEqual = 2,
  GreaterOrEqual = 3,
  LessThan = 4,
  GreaterThan = 5,
}

const set = new Set(Object.values(Compare).filter((x) => typeof x === "number"));

export const compareConfiguration: Record<Compare, { name: string; symbol: string }> = {
  [Compare.NotEqual]: { name: "Not Equal", symbol: "!=" },
  [Compare.Equal]: { name: "Equal", symbol: "==" },
  [Compare.LessOrEqual]: { name: "Less Or Equal", symbol: "<=" },
  [Compare.GreaterOrEqual]: { name: "Greater Or Equal", symbol: ">=" },
  [Compare.LessThan]: { name: "Less Than", symbol: "<" },
  [Compare.GreaterThan]: { name: "Greater Than", symbol: ">" },
};

export function isCompare(compare: number): compare is Compare {
  return set.has(compare);
}
