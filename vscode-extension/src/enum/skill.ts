export enum Skill {
  InfluenceAttentive = 0,
  InfluenceEnvious = 1,
  FocusExtraordinary = 2,
  FocusMenacing = 3,
  LostInThought = 4,
  Charisma = 5,
  CoolComposed = 6,
  Tranquility = 7,
  Downshift = 8,
  Upshift = 9,
  RobotJock = 10,
  TriggerHappy = 11,
  CrystalPrediction = 12,
  CheatCode = 13,
  Algorithm = 14,
  KineticDepth = 15,
  SteelPatience = 16,
  NeuralLiberation = 17,
  Delusion = 18,
  Breathing = 19,
  MelodiousVoice = 20,
  Vocabulary = 21,
  Ambidex = 22,
  Handiwork = 23,
  Trance = 24,
  Observation = 25,
  Run = 26,
  Raise = 27,
  Hope = 40,
  SpMaxPlus1 = 41,
  SpMaxPlus2 = 42,
  SpMaxPlus3 = 43,
  SpMax99 = 44
}

const skillSet = new Set(Object.values(Skill).filter(v => typeof v === "number"));

export function isSkill(skill: number): skill is Skill {
  return skillSet.has(skill);
}
