export enum LogicalCompare {
  NotEqual = 0,
  Equal = 1,
  LessOrEqual = 2,
  GreaterOrEqual = 3,
  LessThan = 4,
  GreaterThan = 5,
}

export enum LogicalJoin {
  And = 6,
  Or = 7
}

const logicalCompareSet = new Set(Object.values(LogicalCompare).filter(v => typeof v === "number"));
const logicalJoinSet = new Set(Object.values(LogicalJoin).filter(v => typeof v === "number"));

export function isLogicalCompare(logicalCompare: number): logicalCompare is LogicalCompare {
  return logicalCompareSet.has(logicalCompare);
}
export function isLogicalJoin(logicalJoin: number): logicalJoin is LogicalJoin {
  return logicalJoinSet.has(logicalJoin);
}

export const joins: Readonly<Record<LogicalJoin, string>> = {
  [LogicalJoin.And]: "And",
  [LogicalJoin.Or]: "Or",
};

export const comparisonOperatorNames: Readonly<Record<LogicalCompare, string>> = {
  [LogicalCompare.NotEqual]: "NotEqual",
  [LogicalCompare.Equal]: "Equal",
  [LogicalCompare.LessOrEqual]: "LessOrEqual",
  [LogicalCompare.GreaterOrEqual]: "GreaterOrEqual",
  [LogicalCompare.LessThan]: "LessThan",
  [LogicalCompare.GreaterThan]: "GreaterThan",
};

export const comparisonOperatorSymbols: Readonly<Record<LogicalCompare, string>> = {
  [LogicalCompare.NotEqual]: "!=",
  [LogicalCompare.Equal]: "==",
  [LogicalCompare.LessOrEqual]: "<=",
  [LogicalCompare.GreaterOrEqual]: ">=",
  [LogicalCompare.LessThan]: "<",
  [LogicalCompare.GreaterThan]: ">",
};