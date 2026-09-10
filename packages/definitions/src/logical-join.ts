export enum LogicalJoin {
  And = 6,
  Or = 7,
}

const logicalJoinSet = new Set(Object.values(LogicalJoin).filter((v) => typeof v === "number"));

export function isLogicalJoin(logicalJoin: number): logicalJoin is LogicalJoin {
  return logicalJoinSet.has(logicalJoin);
}

export const joins: Readonly<Record<LogicalJoin, string>> = {
  [LogicalJoin.And]: "And",
  [LogicalJoin.Or]: "Or",
};
