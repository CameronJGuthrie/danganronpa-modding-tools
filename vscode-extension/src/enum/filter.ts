export enum Filter {
  None = 0,
  Sepia = 1,
}

const set = new Set(Object.values(Filter).filter(v => typeof v === "number"));

export const filterConfiguration: Record<Filter, string> = {
  [Filter.None]: "None",
  [Filter.Sepia]: "Sepia"
}

export function isFilter(filter: number): filter is Filter {
  return set.has(filter);
}
