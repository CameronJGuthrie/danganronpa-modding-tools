export enum FlagGroup {
  System = 0,
  MapUnlock = 1,
  MonocoinCollected = 10, // hidden Monocoin index collected this chapter; reset at every chapter start
  FreeTimeEvent = 12,
  ObjectInvestigated = 13,
  MapInvestigated = 14,
  CharacterInvestigated = 15,
  CharacterDead = 16,
  Skills = 20, // offset is a Skill id; engine-owned, only read by scripts (coin pickup bonus)
  Skills2 = 22, // offset is a Skill id; engine-owned, only read by scripts (free-time bonuses). Distinction from 20 unknown
}

const flagGroupSet = new Set(Object.values(FlagGroup).filter((v) => typeof v === "number"));

export function isFlagGroup(flagGroup: number): flagGroup is FlagGroup {
  return flagGroupSet.has(flagGroup);
}

export const flagGroups: Readonly<Record<FlagGroup, string>> = {
  [FlagGroup.System]: "System",
  [FlagGroup.MonocoinCollected]: "MonocoinCollected",
  [FlagGroup.MapUnlock]: "MapUnlock",
  [FlagGroup.FreeTimeEvent]: "FreeTimeEvent",
  [FlagGroup.ObjectInvestigated]: "ObjectInvestigated",
  [FlagGroup.MapInvestigated]: "MapInvestigated",
  [FlagGroup.CharacterInvestigated]: "CharacterInvestigated",
  [FlagGroup.CharacterDead]: "CharacterDead",
  [FlagGroup.Skills]: "Skills",
  [FlagGroup.Skills2]: "Skills2",
};
