import { Variable } from "../variable.ts";
import { flatMapProperty } from "../data-util.ts";
import { characterData } from "./character-data.ts";

type VariableValueDetail = {
  [value: number]: string;
  formatter?: (value: number) => string;
};

export const variableData: Readonly<Record<Variable, VariableValueDetail | undefined>> = {
  [Variable.Time]: {
    0: "Daytime",
    1: "Nighttime",
    2: "Morning",
    3: "Midnight",
    4: "Time Unknown",
  },
  [Variable.Variable_2]: undefined, // This always has a value of 100. This is probably a volume.
  [Variable.Variable_3]: undefined, // This always has a value of 100. This is probably a volume.
  [Variable.Variable_5]: undefined, // Assigned one time a value of 30.
  [Variable.Wait]: {
    formatter: (val) => `${Number(val / 30).toFixed(2)}s`,
  },
  [Variable.ScriptEntryContext]: undefined,
  [Variable.TrialMinigameTutorialFlag]: {
    0: "False",
    1: "True",
  },
  [Variable.Variable_10]: undefined, // Used once, only set to 0
  [Variable.TimeLimit]: undefined, // 60 or 180, set right before a timed choose-evidence / choose-option prompt in trials.
  [Variable.FreeTimeEventCount]: undefined, // += 1 after StudentReportInfo at the end of each free time event; never read.
  [Variable.Variable_13]: undefined, // Something to do with the class trial
  // A random percentage, 0-99. `If(Random, >=, 50)` is a coin flip, `> 33` / `> 66` a three-way split;
  // `SetVariable(Random, Assign, 0)` before the test appears to reroll it. Only used in free time, gift and School Mode scripts.
  [Variable.Random]: {
    formatter: (val) => `${val}%`,
  },
  [Variable.GameMode]: {
    16: "Transition",
    17: "Exploration", // during chapter init
    18: "Class Trial Minigame <18>", // TODO: which minigame is this mode for?
    19: "Class Trial Minigame <19>", // TODO: which minigame is this mode for?
    20: "Class Trial Minigame <20>", // TODO: which minigame is this mode for?
    21: "Class Trial Minigame <21>", // TODO: which minigame is this mode for?
    22: "Class Trial Minigame <22>", // TODO: which minigame is this mode for?
    23: "Class Trial Minigame <23>", // TODO: which minigame is this mode for?
    24: "Nonstop Debate",
    25: "Class Trial",
  },
  [Variable.Variable_16]: undefined, // Something to do with the minigame. Values seen are 1 and 200.
  [Variable.Regulations]: undefined,
  [Variable.LogicDifficulty]: undefined, // Trials test `!= 2` (Mean) to pick a vaguer hint after a wrong answer. Only written in the Japanese prototype scripts.
  [Variable.Scene]: undefined,
  [Variable.CharactersTalkedTo]: {
    // = 0 at scene setup, += 1 the first time each character is investigated in chapter 3.
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
  },
  [Variable.Monocoin]: undefined, // Monocoin? It's always succeeded by RunScript(8, 30, 0)
  [Variable.Variable_48]: undefined, // Only seems to be used in japanese game files
  [Variable.Variable_50]: undefined, // Something to do with the minigame. Value is always 1.
  [Variable.Variable_56]: { ...flatMapProperty(characterData, "name") }, // Something to do with the minigame. Value is characterId.
  [Variable.DaysRemaining]: undefined, // Set to 50 once at School Mode start.
  [Variable.Variable_59]: undefined, // Something to do with the minigame
  [Variable.Variable_60]: undefined, // Something to do with the minigame
  [Variable.Variable_61]: undefined, // Something to do with the minigame. Value is always 7.
};
