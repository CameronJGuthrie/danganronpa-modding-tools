import { defineEnum, type EnumValue } from "./enum.ts";

export const Variable = defineEnum({
  Time: 0, // →   240 occurrences (3.0%)
  Variable_2: 2, // →   811 occurrences (10.3%)
  Variable_3: 3, // →   811 occurrences (10.3%)
  Variable_5: 5, // →     1 occurrences (0.0%)
  Wait: 6, // →  3402 occurrences (43.0%)
  ScriptEntryContext: 8, // →  1365 occurrences (17.3%)
  TrialMinigameTutorialFlag: 9, // →    38 occurrences (0.5%)
  Variable_10: 10, // →     1 occurrences (0.0%)
  TimeLimit: 11, // →    17 occurrences (0.2%)
  FreeTimeEventCount: 12, // →    40 occurrences (0.5%)
  Influence: 13, // →   190 occurrences; the class trial Influence gauge (see variable-data.ts)
  Random: 14, // →   352 occurrences; a percentage roll 0–99: only compared against 25/33/50/66, only ever assigned 0 (reroll)
  GameMode: 15, // →   113 occurrences (1.4%)
  Monocoins: 16, // →    30 occurrences; the Monocoin balance
  Regulations: 17, // →    40 occurrences (0.5%)
  LogicDifficulty: 19, // →   285 occurrences (3.6%)
  Scene: 20, // →   270 occurrences (3.4%)
  CharactersTalkedTo: 21, // →    45 occurrences (0.6%)
  MonocoinPickup: 30, // →   182 occurrences; the pickup slot (0–31) passed to the coin subroutine
  Variable_48: 48, // →     5 occurrences (0.1%)
  Variable_50: 50, // →     1 occurrences (0.0%)
  Variable_56: 56, // →    15 occurrences (0.2%)
  DaysRemaining: 58, // →     1 occurrences (0.0%)
  Variable_59: 59, // →    30 occurrences (0.4%)
  Variable_60: 60, // →     2 occurrences (0.0%)
  Variable_61: 61, // →     1 occurrences (0.0%)
});
export type Variable = EnumValue<typeof Variable>;

const variableSet = new Set<number>(Object.values(Variable).filter((v) => typeof v === "number"));

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
  [Variable.TimeLimit]: "TimeLimit",
  [Variable.FreeTimeEventCount]: "FreeTimeEventCount",
  [Variable.Influence]: "Influence",
  [Variable.Random]: "Random",
  [Variable.GameMode]: "GameMode",
  [Variable.Monocoins]: "Monocoins",
  [Variable.Regulations]: "Regulations",
  [Variable.LogicDifficulty]: "LogicDifficulty",
  [Variable.Scene]: "Scene",
  [Variable.CharactersTalkedTo]: "CharactersTalkedTo",
  [Variable.MonocoinPickup]: "Monocoin Pickup",
  [Variable.Variable_48]: "",
  [Variable.Variable_50]: "",
  [Variable.Variable_56]: "",
  [Variable.DaysRemaining]: "DaysRemaining",
  [Variable.Variable_59]: "",
  [Variable.Variable_60]: "",
  [Variable.Variable_61]: "",
};
