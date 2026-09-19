export enum Variable {
  Time = 0, // →   240 occurrences (3.0%)
  Variable_2 = 2, // →   811 occurrences (10.3%)
  Variable_3 = 3, // →   811 occurrences (10.3%)
  Variable_5 = 5, // →     1 occurrences (0.0%)
  Wait = 6, // →  3402 occurrences (43.0%)
  ScriptEntryContext = 8, // →  1365 occurrences (17.3%)
  TrialMinigameTutorialFlag = 9, // →    38 occurrences (0.5%)
  Variable_10 = 10, // →     1 occurrences (0.0%)
  Variable_11 = 11, // →    17 occurrences (0.2%)
  Variable_12 = 12, // →    40 occurrences (0.5%)
  Variable_13 = 13, // →   190 occurrences (2.4%)
  GameMode = 15, // →   113 occurrences (1.4%)
  Variable_16 = 16, // →     2 occurrences (0.0%)
  Regulations = 17, // →    40 occurrences (0.5%)
  Variable_19 = 19, // →   285 occurrences (3.6%)
  Scene = 20, // →   270 occurrences (3.4%)
  Variable_21 = 21, // →    45 occurrences (0.6%)
  Monocoin = 30, // →   182 occurrences (2.3%)
  Variable_48 = 48, // →     5 occurrences (0.1%)
  Variable_50 = 50, // →     1 occurrences (0.0%)
  Variable_56 = 56, // →    15 occurrences (0.2%)
  Variable_58 = 58, // →     1 occurrences (0.0%)
  Variable_59 = 59, // →    30 occurrences (0.4%)
  Variable_60 = 60, // →     2 occurrences (0.0%)
  Variable_61 = 61, // →     1 occurrences (0.0%)
}

const variableSet = new Set(Object.values(Variable).filter((v) => typeof v === "number"));

export function isVariable(variable: number): variable is Variable {
  return variableSet.has(variable);
}

export const variables: Readonly<Record<Variable, string>> = {
  [Variable.Time]: "Time",
  [Variable.Variable_2]: "MasterVolume_1",
  [Variable.Variable_3]: "MasterVolume_2",
  [Variable.Variable_5]: "",
  [Variable.Wait]: "Wait",
  [Variable.ScriptEntryContext]: "ScriptEntryContext",
  [Variable.TrialMinigameTutorialFlag]: "TrialMinigameTutorialFlag",
  [Variable.Variable_10]: "",
  [Variable.Variable_11]: "",
  [Variable.Variable_12]: "",
  [Variable.Variable_13]: "",
  [Variable.GameMode]: "GameMode",
  [Variable.Variable_16]: "",
  [Variable.Regulations]: "Regulations",
  [Variable.Variable_19]: "",
  [Variable.Scene]: "Scene",
  [Variable.Variable_21]: "",
  [Variable.Monocoin]: "Monocoin",
  [Variable.Variable_48]: "",
  [Variable.Variable_50]: "",
  [Variable.Variable_56]: "",
  [Variable.Variable_58]: "",
  [Variable.Variable_59]: "",
  [Variable.Variable_60]: "",
  [Variable.Variable_61]: "",
};
