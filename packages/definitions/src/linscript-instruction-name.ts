export const LinscriptInstructionName = {
  Animation: "Animation",
  CameraFlash: "CameraFlash",
  Character: "Character", // Source-only: `Character(id, Name)` inside Meta() names a placed-character slot for the file
  Goto: "Goto",
  If: "If",
  IfFlag: "IfFlag",
  IfFreeTimeEvent: "IfFreeTimeEvent",
  IfRelationship: "IfRelationship",
  Label: "Label",
  LabelName: "LabelName", // Source-only: `LabelName(id, Name)` inside Meta() names a jump label for the file
  LoadMap: "LoadMap",
  LoadScript: "LoadScript",
  LoadSprite: "LoadSprite",
  Meta: "Meta", // Source-only: opens the block of per-script annotations at the bottom of a file
  Movie: "Movie",
  Music: "Music",
  Object: "Object", // Source-only: `Object(id, Name)` inside Meta() names an object id for the file
  ObjectState: "ObjectState",
  OnCharacter: "OnCharacter",
  OnObject: "OnObject",
  Option: "Option", // Sugar for SetOption(n) + RawText("label\n") + WaitFrame: a labelled menu choice
  PostProcessingEffect: "PostProcessingEffect",
  GivePresent: "GivePresent", // Sugar for Present(id, -=, 1): the player hands a gift over
  ReceivePresent: "ReceivePresent", // Sugar for Present(id, +=, 1): the player is awarded an item
  RawText: "RawText", // The binary text opcode; Text is sugar that adds WaitFrame/TextStyle/WaitInput
  Return: "Return",
  RunScript: "RunScript",
  ScreenFade: "ScreenFade",
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
  TrialCamera: "TrialCamera",
  TruthBulletFlag: "TruthBulletFlag",
  UnlockSkill: "UnlockSkill",
  Voice: "Voice",
  Wait: "Wait", // Sugar for SetVariable(Wait, Assign, frames)
  WaitFrame: "WaitFrame",
  WaitInput: "WaitInput",
} as const;
export type LinscriptInstructionName = (typeof LinscriptInstructionName)[keyof typeof LinscriptInstructionName];
