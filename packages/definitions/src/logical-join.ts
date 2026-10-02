import { defineEnum, type EnumValue } from "./enum.ts";

export const LogicalJoin = defineEnum({
  And: 6,
  Or: 7,
});
export type LogicalJoin = EnumValue<typeof LogicalJoin>;

const logicalJoinSet = new Set<number>(Object.values(LogicalJoin).filter((v) => typeof v === "number"));

export function isLogicalJoin(logicalJoin: number): logicalJoin is LogicalJoin {
  return logicalJoinSet.has(logicalJoin);
}

export const joins: Readonly<Record<LogicalJoin, string>> = {
  [LogicalJoin.And]: "And",
  [LogicalJoin.Or]: "Or",
};
