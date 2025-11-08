import { ThemableDecorationAttachmentRenderOptions } from "vscode";

export type LinscriptFunction<Parameters extends readonly Parameter[] = Parameter[]> = {
  name: FunctionName;
  opcode: string;
  varargs?: boolean;
  parameters: Parameters;
  decorations?: (
    args: { [K in keyof Parameters]: number },
    documentText: string
  ) => string | ThemableDecorationAttachmentRenderOptions[];
};

export enum FunctionName {
  Animation = "Animation",
  ChangeUI = "ChangeUI",
  CheckCharacter = "CheckCharacter",
  CheckObject = "CheckObject",
  Evaluate = "Evaluate",
  EvaluateFlag = "EvaluateFlag",
  EvaluateFreeTimeEvent = "EvaluateFreeTimeEvent",
  EvaluateRelationship = "EvaluateRelationship",
  Goto = "Goto",
  IfTrue = "IfTrue",
  Interaction = "Interaction",
  LoadScript = "LoadScript",
  LoadSprite = "LoadSprite",
  Movie = "Movie",
  Music = "Music",
  PostProcessingEffect = "PostProcessingEffect",
  Present = "Present",
  RunScript = "RunScript",
  ScreenFade = "ScreenFade",
  ScreenFlash = "ScreenFlash",
  Script = "Script",
  Label = "Label",
  SetVar16 = "SetVar16",
  SetVar8 = "SetVar8",
  ShowBackground = "ShowBackground",
  Sound = "Sound",
  SoundB = "SoundB",
  Speaker = "Speaker",
  Sprite = "Sprite",
  SpriteFlash = "SpriteFlash",
  StudentRelationship = "StudentRelationship",
  StudentReportCard = "StudentReportCard",
  StudentReportInfo = "StudentReportInfo",
  StudentTitleEntry = "StudentTitleEntry",
  Text = "Text",
  TextStyle = "TextStyle",
  TruthBulletFlag = "TruthBulletFlag",
  UnlockSkill = "UnlockSkill",
  Voice = "Voice",
}

export type LinscriptValue =
  | string
  | {
    name: string;
    description?: string;
  };

type Parameter = {
  /**
   * The name of the parameter.
   */
  name?: string;
  /**
   * Other data to keep that won't appear in the editor as a decoration
   */
  description?: string;
  /**
   * Whether this parameter is understood
   */
  unknown?: true;
  /**
   * Map of numbers to LinscriptValue, can be a simple string but might also indicate typing for other params
   */
  values?: { [key: number]: LinscriptValue };
};
