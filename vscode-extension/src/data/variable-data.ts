import { Variable } from "../enum/variable";
import { flatMapProperty } from "../util/data-util";
import { characterData } from "./character-data";

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
  [Variable._2]: undefined, // This always has a value of 100. This is probably a volume.
  [Variable._3]: undefined, // This always has a value of 100. This is probably a volume.
  [Variable._5]: undefined, // Assigned one time a value of 30.
  [Variable.Wait]: {
    formatter: (val) => `${Number(val / 30).toFixed(2)}s`,
  },
  [Variable.ScriptEntryContext]: undefined,
  [Variable.TrialMinigameTutorialFlag]: {
    0: "False",
    1: "True",
  },
  [Variable._10]: undefined, // Used once, only set to 0
  [Variable._11]: undefined, // Some kind of timer used during the class trial's bad ending.
  [Variable._12]: undefined,
  [Variable._13]: undefined, // Something to do with the class trial
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
  [Variable._16]: undefined, // Something to do with the minigame. Values seen are 1 and 200.
  [Variable.Regulations]: undefined,
  [Variable._19]: undefined, // Only seems to be used in japanese game files
  [Variable.Scene]: undefined,
  [Variable._21]: {
    // Something to do with the camera?
    0: "0",
    1: "1",
    2: "2",
    3: "3",
    4: "4",
  },
  [Variable.Monocoin]: undefined, // Monocoin? It's always succeeded by RunScript(8, 30, 0)
  [Variable._48]: undefined, // Only seems to be used in japanese game files
  [Variable._50]: undefined, // Something to do with the minigame. Value is always 1.
  [Variable._56]: { ...flatMapProperty(characterData, "name") }, // Something to do with the minigame. Value is characterId.
  [Variable._58]: undefined, // Something to do with the minigame. Value is always 50.
  [Variable._59]: undefined, // Something to do with the minigame
  [Variable._60]: undefined, // Something to do with the minigame
  [Variable._61]: undefined, // Something to do with the minigame. Value is always 7.
};
