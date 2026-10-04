export const LinscriptInstructionName = {
  Animation: "Animation",
  CameraFlash: "CameraFlash",
  FadeIn: "FadeIn", // Sugar for ScreenFade(0, colour, frames): reveals the screen from a full-screen colour
  FadeOut: "FadeOut", // Sugar for ScreenFade(1, colour, frames): covers the screen with a full-screen colour
  FadeOutThenWait: "FadeOutThenWait", // Sugar for ScreenFade(101, colour, frames): FadeOut that finishes before the script continues, used before leaving a script
  CharacterName: "CharacterName", // Source-only: `CharacterName(id, Name)` inside Meta() names a placed-character slot for the file
  Goto: "Goto",
  If: "If",
  IfFlag: "IfFlag",
  IfFreeTimeEvent: "IfFreeTimeEvent",
  IfRelationship: "IfRelationship",
  Label: "Label",
  LabelName: "LabelName", // Source-only: `LabelName(id, Name)` inside Meta() names a jump label for the file
  LoadMap: "LoadMap",
  LoadScript: "LoadScript",
  MapCharacter: "MapCharacter", // Sugar for the hidden MapState(room, character, True|False) opcode: a character's room on the map roster
  MapClearAll: "MapClearAll", // Sugar for MapState(255, 0, 255): resets every map table at once
  MapClearCharacterStatus: "MapClearCharacterStatus", // Sugar for MapState(255, 0, 252): resets the per-character status the map keeps (untested in game)
  MapClearPositions: "MapClearPositions", // Sugar for MapState(255, 0, 254): removes every character from every room
  MapIcons: "MapIcons", // Sugar for MapState(255, True|False, 253): toggles the map's character icons (untested in game)
  Meta: "Meta", // Source-only: opens the block of per-script annotations at the bottom of a file
  Mode: "Mode", // Sugar for SetUI(Thinking, …) + SetUI(Name, Shown) + Speaker(character), or SetUI(Name, Hidden) + Speaker(Blank) for System: who is talking and whether aloud
  Movie: "Movie",
  Music: "Music",
  ObjectName: "ObjectName", // Source-only: `ObjectName(id, Name)` inside Meta() names an object id for the file
  ObjectState: "ObjectState",
  OnCharacter: "OnCharacter",
  OnObject: "OnObject",
  Option: "Option", // Sugar for SetOption(n) + RawText("label\n") + WaitFrame: a labelled menu choice
  OptionName: "OptionName", // Source-only: `OptionName(id, Name)` inside Meta() names a menu option id for the file
  PlaceSprite: "PlaceSprite", // Sugar for Sprite(slot, character, expression, 0, 0): places a character in a slot without showing a bust-up
  PostProcessingEffect: "PostProcessingEffect",
  GivePresent: "GivePresent", // Sugar for Present(id, -=, 1): the player hands a gift over
  ReceivePresent: "ReceivePresent", // Sugar for Present(id, +=, 1): the player is awarded an item
  RawText: "RawText", // The binary text opcode; Text is sugar that adds WaitFrame/TextStyle/WaitInput
  Return: "Return",
  RunScript: "RunScript",
  SceneFlagName: "SceneFlagName", // Source-only: `SceneFlagName(id, Name)` inside Meta() names a SceneFlags slot for the file
  ScreenFlash: "ScreenFlash",
  SetFlag: "SetFlag",
  SetOption: "SetOption",
  SetUI: "SetUI",
  SetVariable: "SetVariable",
  ShowBackground: "ShowBackground",
  Sound: "Sound",
  SoundB: "SoundB",
  Speaker: "Speaker",
  Sprite: "Sprite",
  SpriteFlash: "SpriteFlash",
  StopScript: "StopScript",
  StudentRelationship: "StudentRelationship",
  StudentReportInfo: "StudentReportInfo",
  StudentTitleEntry: "StudentTitleEntry",
  Text: "Text",
  TextStyle: "TextStyle",
  Time: "Time", // Sugar for SetVariable(Time, Assign, TimeOfDay)
  TrialCamera: "TrialCamera",
  TruthBulletFlag: "TruthBulletFlag",
  UnlockSkill: "UnlockSkill",
  Voice: "Voice",
  Wait: "Wait", // Sugar for SetVariable(Wait, Assign, frames)
  WaitFrame: "WaitFrame",
  WaitInput: "WaitInput",
} as const;
export type LinscriptInstructionName = (typeof LinscriptInstructionName)[keyof typeof LinscriptInstructionName];
