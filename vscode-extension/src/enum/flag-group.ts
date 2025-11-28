export enum FlagGroup {
  System = 0,
  MapUnlock = 1,
  Unknown = 10, // Only appears in chapter during bulk resets, possibly this is unused
  FreeTimeEvent = 12,
  ObjectInvestigated = 13,
  MapInvestigated = 14,
  CharacterInvestigated = 15,
  CharacterDead = 16,
}

const flagGroupSet = new Set(Object.values(FlagGroup).filter(v => typeof v === "number"));

export function isFlagGroup(flagGroup: number): flagGroup is FlagGroup {
  return flagGroupSet.has(flagGroup);
}

export const flagGroups: Readonly<Record<FlagGroup, string>> = {
  [FlagGroup.System]: "System",
  [FlagGroup.Unknown]: "Unknown",
  [FlagGroup.MapUnlock]: "MapUnlock",
  [FlagGroup.FreeTimeEvent]: "FreeTimeEvent",
  [FlagGroup.ObjectInvestigated]: "ObjectInvestigated",
  [FlagGroup.MapInvestigated]: "MapInvestigated",
  [FlagGroup.CharacterInvestigated]: "CharacterInvestigated",
  [FlagGroup.CharacterDead]: "CharacterDeath"
};