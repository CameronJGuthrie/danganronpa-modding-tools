import { Character } from "../character.ts";
import { FlagGroup } from "../flag-group.ts";
import { Skill } from "../skill.ts";
import { characterData } from "./character-data.ts";

export const RESET_FLAGS = 32;

export const flagDataByFlagGroup: Readonly<Record<FlagGroup, { [offset: number]: { name: string } } | undefined>> = {
  [FlagGroup.System]: {
    4: { name: "HandbookEnabled" },
    5: { name: "MapEnabled" },
    6: { name: "TruthBulletEnabled" },
    7: { name: "SaveEnabled" },
    12: { name: "RoomExitEnabled" },
  },
  [FlagGroup.MapUnlock]: {
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.MonocoinCollected]: {
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.FreeTimeEvent]: {
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.ObjectInvestigated]: {
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.MapInvestigated]: {
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.CharacterInvestigated]: {
    ...characterData,
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.CharacterDead]: characterData,
  [FlagGroup.Skills]: undefined,
  [FlagGroup.Skills2]: undefined,
};

/**
 * The names a flag offset can be written by in `.linscript`, per flag group: the known flag names
 * above, plus the `Character` / `Skill` enums for the groups whose offsets are those ids. Each
 * table maps names to offsets and offsets back to names, like an enum object.
 */
export const flagNamesByFlagGroup: Readonly<Record<FlagGroup, Readonly<Record<string, string | number>>>> = {
  [FlagGroup.System]: namesOf(FlagGroup.System),
  [FlagGroup.MapUnlock]: namesOf(FlagGroup.MapUnlock),
  [FlagGroup.MonocoinCollected]: namesOf(FlagGroup.MonocoinCollected),
  [FlagGroup.FreeTimeEvent]: namesOf(FlagGroup.FreeTimeEvent),
  [FlagGroup.ObjectInvestigated]: namesOf(FlagGroup.ObjectInvestigated),
  [FlagGroup.MapInvestigated]: namesOf(FlagGroup.MapInvestigated),
  [FlagGroup.CharacterInvestigated]: namesOf(FlagGroup.CharacterInvestigated, Character),
  [FlagGroup.CharacterDead]: namesOf(FlagGroup.CharacterDead, Character),
  [FlagGroup.Skills]: namesOf(FlagGroup.Skills, Skill),
  [FlagGroup.Skills2]: namesOf(FlagGroup.Skills2, Skill),
};

function namesOf(group: FlagGroup, base: Readonly<Record<string, string | number>> = {}) {
  const table: Record<string, string | number> = { ...base };
  for (const [offset, { name }] of Object.entries(flagDataByFlagGroup[group] ?? {})) {
    table[name] = Number(offset);
    table[offset] = name;
  }
  return Object.freeze(table);
}
