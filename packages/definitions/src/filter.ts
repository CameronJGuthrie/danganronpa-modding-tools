import { defineEnum, type EnumValue } from "./enum.ts";

export const Filter = defineEnum({
  None: 0,
  Sepia: 1,
});
export type Filter = EnumValue<typeof Filter>;

const set = new Set<number>(Object.values(Filter).filter((v) => typeof v === "number"));

export const filterConfiguration: Record<Filter, string> = {
  [Filter.None]: "None",
  [Filter.Sepia]: "Sepia",
};

export function isFilter(filter: number): filter is Filter {
  return set.has(filter);
}
