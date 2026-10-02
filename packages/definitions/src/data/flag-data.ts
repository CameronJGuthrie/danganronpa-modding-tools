import { FlagGroup } from "../flag-group.ts";
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
