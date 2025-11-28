export enum Variable {
  Time = 0,                     // →   240 occurrences (3.0%)
  _2 = 2,                     // →   811 occurrences (10.3%)
  _3 = 3,                     // →   811 occurrences (10.3%)
  _5 = 5,                     // →     1 occurrences (0.0%)
  Wait = 6,                     // →  3402 occurrences (43.0%)
  ScriptEntryContext = 8,                     // →  1365 occurrences (17.3%)
  TrialMinigameTutorialFlag = 9,                     // →    38 occurrences (0.5%)
  _10 = 10,                   // →     1 occurrences (0.0%)
  _11 = 11,                   // →    17 occurrences (0.2%)
  _12 = 12,                   // →    40 occurrences (0.5%)
  _13 = 13,                   // →   190 occurrences (2.4%)
  GameMode = 15,                   // →   113 occurrences (1.4%)
  _16 = 16,                   // →     2 occurrences (0.0%)
  Regulations = 17,                   // →    40 occurrences (0.5%)
  _19 = 19,                   // →   285 occurrences (3.6%)
  Scene = 20,                   // →   270 occurrences (3.4%)
  _21 = 21,                   // →    45 occurrences (0.6%)
  Monocoin = 30,                   // →   182 occurrences (2.3%)
  _48 = 48,                   // →     5 occurrences (0.1%)
  _50 = 50,                   // →     1 occurrences (0.0%)
  _56 = 56,                   // →    15 occurrences (0.2%)
  _58 = 58,                   // →     1 occurrences (0.0%)
  _59 = 59,                   // →    30 occurrences (0.4%)
  _60 = 60,                   // →     2 occurrences (0.0%)
  _61 = 61,                   // →     1 occurrences (0.0%)
}

const variableSet = new Set(Object.values(Variable).filter(v => typeof v === "number"));

export function isVariable(variable: number): variable is Variable {
  return variableSet.has(variable);
}

export const variables: Readonly<Record<Variable, string>> = {
  [Variable.Time]: "Time",
  [Variable._2]: "MasterVolume_1",
  [Variable._3]: "MasterVolume_2",
  [Variable._5]: "",
  [Variable.Wait]: "Wait",
  [Variable.ScriptEntryContext]: "ScriptEntryContext",
  [Variable.TrialMinigameTutorialFlag]: "TrialMinigameTutorialFlag",
  [Variable._10]: "",
  [Variable._11]: "",
  [Variable._12]: "",
  [Variable._13]: "",
  [Variable.GameMode]: "GameMode",
  [Variable._16]: "",
  [Variable.Regulations]: "Regulations",
  [Variable._19]: "",
  [Variable.Scene]: "Scene",
  [Variable._21]: "",
  [Variable.Monocoin]: "Monocoin",
  [Variable._48]: "",
  [Variable._50]: "",
  [Variable._56]: "",
  [Variable._58]: "",
  [Variable._59]: "",
  [Variable._60]: "",
  [Variable._61]: ""
};