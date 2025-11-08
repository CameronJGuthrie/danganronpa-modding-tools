import { Character } from "../enum/character";
import { FlagGroup } from "../enum/flag-group";
import { characterConfiguration } from "./character-data";

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
  [FlagGroup.Unknown]: {
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
    ...characterConfiguration,
    [RESET_FLAGS]: { name: "Reset" },
  },
  [FlagGroup.CharacterDead]: characterConfiguration
}