import { ParameterType } from "./parameter.definition.ts";

/** Every opcode in the compiled script data is introduced by this marker byte. */
export const OPCODE_MARKER = 0x70;

/**
 * How an opcode's arguments convert between the raw bytes on a `ScriptEntry` and the argument
 * list written in `.linscript`. `src/opcodes/arguments.ts` interprets every kind.
 */
export type ArgumentSpec =
  /** A fixed layout of parameters. */
  | { kind: "fixed"; layout: readonly ParameterType[] }
  /** A `head` layout followed by any number of `tail` layouts, e.g. a chain of comparisons. */
  | { kind: "repeat"; head: readonly ParameterType[]; tail: readonly ParameterType[] }
  /** At least `min` plain bytes, shown verbatim because their structure is not understood. */
  | { kind: "variadic"; min: number }
  /** A text id in binary; the quoted string itself in source. */
  | { kind: "text" }
  /** The text entry count in binary; `Text` or `Textless` in source. */
  | { kind: "type" };

export interface OpcodeRow {
  id: number;
  args: ArgumentSpec;
  /** Opens an indented block in source; an argument of 255 closes it instead. */
  block?: true;
}

const { Byte, UInt16BE } = ParameterType;

function fixed(layout: readonly ParameterType[]): ArgumentSpec {
  return { kind: "fixed", layout };
}

function bytes(quantity: number): ArgumentSpec {
  return { kind: "fixed", layout: new Array<ParameterType>(quantity).fill(Byte) };
}

function none(): ArgumentSpec {
  return { kind: "fixed", layout: [] };
}

// biome-ignore format: keep the table columns aligned
/** Every known binary opcode, keyed by source name. Add a row here to teach the compiler a new one. */
export const opcodes = {
  Type:                  { id: 0x00, args: { kind: "type" } },
  LoadSprite:            { id: 0x01, args: bytes(3) },
  Text:                  { id: 0x02, args: { kind: "text" } },
  TextStyle:             { id: 0x03, args: bytes(1) },
  PostProcessingEffect:  { id: 0x04, args: bytes(4) },
  Movie:                 { id: 0x05, args: bytes(2) },
  Animation:             { id: 0x06, args: fixed([UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte]) },
  Voice:                 { id: 0x08, args: fixed([Byte, Byte, UInt16BE, Byte]) },
  Music:                 { id: 0x09, args: bytes(3) },
  Sound:                 { id: 0x0a, args: fixed([UInt16BE, Byte]) },
  SoundB:                { id: 0x0b, args: bytes(2) },
  TruthBulletFlag:       { id: 0x0c, args: bytes(2) },
  Present:               { id: 0x0d, args: bytes(3) },
  UnlockSkill:           { id: 0x0e, args: bytes(2) },
  StudentTitleEntry:     { id: 0x0f, args: bytes(3) },
  StudentReportInfo:     { id: 0x10, args: bytes(3) },
  StudentRelationship:   { id: 0x11, args: bytes(4) },
  TrialCamera:           { id: 0x14, args: fixed([Byte, UInt16BE]) },
  LoadMap:               { id: 0x15, args: bytes(3) },
  LoadScript:            { id: 0x19, args: bytes(3) },
  StopScript:            { id: 0x1a, args: bytes(0) },
  RunScript:             { id: 0x1b, args: bytes(3) },
  RestartScript:         { id: 0x1c, args: bytes(0) },
  Sprite:                { id: 0x1e, args: bytes(5) },
  ScreenFlash:           { id: 0x1f, args: bytes(7) },
  SpriteFlash:           { id: 0x20, args: bytes(5) },
  Speaker:               { id: 0x21, args: bytes(1) },
  ScreenFade:            { id: 0x22, args: bytes(3) },
  ObjectState:           { id: 0x23, args: bytes(5) },
  ChangeUI:              { id: 0x25, args: bytes(2) },
  SetVar8:               { id: 0x26, args: bytes(3) },
  CheckCharacter:        { id: 0x27, args: bytes(1), block: true },
  CheckObject:           { id: 0x29, args: bytes(1), block: true },
  Label:                 { id: 0x2a, args: fixed([UInt16BE]) },
  SetOption:             { id: 0x2b, args: bytes(1), block: true },
  EndOfJump:             { id: 0x2c, args: bytes(2) },
  CameraFlash:           { id: 0x2e, args: bytes(2) },
  ShowBackground:        { id: 0x30, args: fixed([UInt16BE, Byte]) },
  SetVar16:              { id: 0x33, args: fixed([Byte, Byte, UInt16BE]) },
  Goto:                  { id: 0x34, args: fixed([UInt16BE]) },
  /** Three fixed bytes, a count byte, then flag-check bytes whose structure is not yet understood. */
  EvaluateFlag:          { id: 0x35, args: { kind: "variadic", min: 4 } },
  /** `value1, operand, value2` followed by any number of `joiner, value1, operand, value2`. */
  Evaluate:              { id: 0x36, args: { kind: "repeat", head: [UInt16BE, Byte, UInt16BE], tail: [Byte, UInt16BE, Byte, UInt16BE] } },
  EvaluateFreeTimeEvent: { id: 0x38, args: fixed([UInt16BE, Byte, UInt16BE]) },
  EvaluateRelationship:  { id: 0x39, args: fixed([UInt16BE, Byte, UInt16BE]) },
  WaitInput:             { id: 0x3a, args: none() },
  WaitFrame:             { id: 0x3b, args: none() },
  IfTrue:                { id: 0x3c, args: none() },
} as const satisfies Record<string, OpcodeRow>;

/** A binary opcode's source name. */
export type OpcodeName = keyof typeof opcodes;

/** Binary opcode ids by source name, e.g. `Opcode.Text`. */
export const Opcode = Object.fromEntries(Object.entries(opcodes).map(([name, row]) => [name, row.id])) as {
  readonly [K in OpcodeName]: (typeof opcodes)[K]["id"];
};

/** A binary opcode id. */
export type Opcode = (typeof Opcode)[OpcodeName];
