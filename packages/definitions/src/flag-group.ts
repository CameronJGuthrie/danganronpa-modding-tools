import { defineEnum, type EnumValue } from "./enum.ts";

export const FlagGroup = defineEnum({
  System: 0,
  MapUnlock: 1,
  MonocoinCollected: 10, // hidden Monocoin index collected this chapter; reset at every chapter start
  FreeTimeEvent: 12,
  ObjectInvestigated: 13,
  MapInvestigated: 14,
  SceneFlags: 15, // per-scene scratch booleans: cleared by every scene entry script, slots handed out from 0 as a scene needs them; named per script with SceneFlagName(id, Name) in Meta()
  CharacterDead: 16,
  Skills: 20, // offset is a Skill id; engine-owned, only read by scripts (coin pickup bonus)
  Skills2: 22, // offset is a Skill id; engine-owned, only read by scripts (free-time bonuses). Distinction from 20 unknown
});
export type FlagGroup = EnumValue<typeof FlagGroup>;

const flagGroupSet = new Set<number>(Object.values(FlagGroup).filter((v) => typeof v === "number"));

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
  [FlagGroup.SceneFlags]: "SceneFlags",
  [FlagGroup.CharacterDead]: "CharacterDead",
  [FlagGroup.Skills]: "Skills",
  [FlagGroup.Skills2]: "Skills2",
};
