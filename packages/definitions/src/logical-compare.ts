export enum LogicalCompare {
  NotEqual = 0,
  Equal = 1,
  LessOrEqual = 2,
  GreaterOrEqual = 3,
  LessThan = 4,
  GreaterThan = 5,
}

const logicalCompareSet = new Set(Object.values(LogicalCompare).filter((v) => typeof v === "number"));

export function isLogicalCompare(logicalCompare: number): logicalCompare is LogicalCompare {
  return logicalCompareSet.has(logicalCompare);
}
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
