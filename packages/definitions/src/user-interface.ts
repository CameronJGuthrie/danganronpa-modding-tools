import { defineEnum, type EnumValue } from "./enum.ts";

export const UserInterface = defineEnum({
  Thinking: 0,
  Textbox: 1,
  Name: 2,
  HUD: 3,
  Minimap: 5,
  BlackBackground: 6,
  TextboxOnly: 7,
  ClassTrial: 8,
  BustUp: 9,
  MovieBackground: 11,
  Save: 12,
  Rumble: 13,
  CameraPan: 14,
  CameraLook: 15,
  Investigate: 16,
  ChooseOption: 18,
  ChoosePresent: 19,
  BleepText: 23,
  CameraZoom: 25,
  CameraCharacter: 26,
  CameraSubarea: 27,
  PanicTalkAction: 33,
  ChooseEvidence: 35,
  ChoosePerson: 37,
  MonoMonoMachine: 41,
  VendingMachine: 44,
  IslandMode: 50,
  Minimal: 51,
  LogicDive: 71,
  SplitScreen: 72,
});
export type UserInterface = EnumValue<typeof UserInterface>;

/**
 * The second argument of `SetUI` for most interfaces. 0 and 1 are hide/show; a few interfaces
 * accept larger mode values, which have no name and stay numeric in source. `ChooseOption` is the
 * exception: its byte picks a menu style (`ChooseOptionMenu`).
 */
export const UiVisibility = defineEnum({
  Hidden: 0,
  Shown: 1,
});
export type UiVisibility = EnumValue<typeof UiVisibility>;

/**
 * The second argument of `SetUI(ChooseOption, ...)`: which kind of choice box to open. Every
 * shipped menu is written as `SetUI(ChooseOption, Hidden)` followed by `SetUI(ChooseOption, n)`
 * and the `Goto` over its `Option(...)` table, and the shape of the table that follows depends
 * on `n`. The names describe where the game uses each style, inferred from the 2896 shipped
 * uses and not tested in game: 1 opens the free-time talk-topic lists (three options), 2 the
 * ordinary two-choice list with custom labels ("Yes, definitely" / "Not really, no", "The killer"
 * / "The victim"), 3 only ever a literal "Yes" / "No" pair, and 4 the School Mode prompts
 * ("Absolutely!" / "Not at all!") and the debug trial-skip menus. Whether 1, 2 and 4 differ in
 * layout or only in size is unknown.
 */
export const ChooseOptionMenu = defineEnum({
  Hidden: 0,
  TopicList: 1,
  TwoChoice: 2,
  YesNo: 3,
  Wide: 4,
});
export type ChooseOptionMenu = EnumValue<typeof ChooseOptionMenu>;

/**
 * The name table for the second argument of `SetUI`, per interface: `ChooseOptionMenu` for
 * `ChooseOption`, `UiVisibility` for everything else (see `uiModeNames`).
 */
export const uiModeNamesByUserInterface: Readonly<Record<number, Readonly<Record<string, string | number>>>> = {
  [UserInterface.ChooseOption]: ChooseOptionMenu,
};
