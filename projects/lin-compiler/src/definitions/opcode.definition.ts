/** Every opcode in the compiled script data is introduced by this marker byte. */
export const OPCODE_MARKER = 0x70;

/** Every known binary opcode, keyed by its source name and mapped to its id byte. */
export const Opcode = {
  Type: 0x00,
  LoadSprite: 0x01,
  Text: 0x02,
  TextStyle: 0x03,
  PostProcessingEffect: 0x04,
  Movie: 0x05,
  Animation: 0x06,
  // No 0x07
  Voice: 0x08,
  Music: 0x09,
  Sound: 0x0a,
  SoundB: 0x0b,
  TruthBulletFlag: 0x0c,
  Present: 0x0d,
  UnlockSkill: 0x0e,
  StudentTitleEntry: 0x0f,
  StudentReportInfo: 0x10,
  StudentRelationship: 0x11,
  // No 0x12, 0x13
  TrialCamera: 0x14,
  LoadMap: 0x15,
  // No 0x16, 0x17, 0x18
  LoadScript: 0x19,
  StopScript: 0x1a,
  RunScript: 0x1b,
  RestartScript: 0x1c,
  // No 0x1d
  Sprite: 0x1e,
  ScreenFlash: 0x1f,
  SpriteFlash: 0x20,
  Speaker: 0x21,
  ScreenFade: 0x22,
  ObjectState: 0x23,
  // No 0x24
  ChangeUI: 0x25,
  SetVar8: 0x26,
  CheckCharacter: 0x27,
  // No 0x28
  CheckObject: 0x29,
  Label: 0x2a,
  SetOption: 0x2b,
  EndOfJump: 0x2c,
  // No 0x2d
  CameraFlash: 0x2e,
  // No 0x2f
  ShowBackground: 0x30,
  // No 0x31, 0x32
  SetVar16: 0x33,
  Goto: 0x34,
  EvaluateFlag: 0x35,
  Evaluate: 0x36,
  // No 0x37
  EvaluateFreeTimeEvent: 0x38,
  EvaluateRelationship: 0x39,
  WaitInput: 0x3a,
  WaitFrame: 0x3b,
  IfTrue: 0x3c,
} as const;

/** A binary opcode id. */
export type Opcode = (typeof Opcode)[keyof typeof Opcode];

/** A binary opcode's source name. */
export type OpcodeName = keyof typeof Opcode;

const namesById = new Map<number, OpcodeName>(
  (Object.entries(Opcode) as [OpcodeName, Opcode][]).map(([name, id]) => [id, name]),
);

/** The source name of a binary opcode id. */
export function opcodeName(id: Opcode): OpcodeName {
  const name = namesById.get(id);
  if (name === undefined) {
    throw new RangeError(`unknown opcode id ${id}`);
  }
  return name;
}
