import {
  Bool,
  Character,
  comparisonOperators,
  FlagGroup,
  LogicalJoin,
  UiVisibility,
  UserInterface,
} from "linscript-definitions";
import { type NamedValues, type Parameter, ParameterType } from "./parameter.definition.ts";

/** Every opcode in the compiled script data is introduced by this marker byte. */
export const OPCODE_MARKER = 0x70;

/**
 * How an opcode's arguments convert between the raw bytes on a `ScriptEntry` and the argument
 * list written in `.linscript`. `src/opcodes/arguments.ts` interprets every kind.
 */
export type ArgumentSpec =
  /** A fixed layout of parameters. */
  | { kind: "fixed"; layout: readonly Parameter[] }
  /** A `head` layout followed by any number of `tail` layouts, e.g. a chain of comparisons. */
  | { kind: "repeat"; head: readonly Parameter[]; tail: readonly Parameter[] }
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
  /**
   * Not writable by name in source: the opcode only appears through sugar, so bytes the sugar
   * cannot express surface as errors instead of a raw fallback.
   */
  hidden?: true;
}

const { Byte, UInt16BE } = ParameterType;

function fixed(layout: readonly Parameter[]): ArgumentSpec {
  return { kind: "fixed", layout };
}

/** A parameter whose values are written by name in source, e.g. `Speaker(Makoto)`. */
function named(type: ParameterType, names: NamedValues): Parameter {
  return { type, names };
}

function bytes(quantity: number): ArgumentSpec {
  return { kind: "fixed", layout: new Array<ParameterType>(quantity).fill(Byte) };
}

function none(): ArgumentSpec {
  return { kind: "fixed", layout: [] };
}

/** A flag group byte, written by name (`CharacterInvestigated`); unknown groups stay numeric. */
const flagGroup = named(Byte, FlagGroup);
/**
 * A flag offset byte. Its meaning depends on the flag group just before it: for the character
 * groups it is a character id and is written by name; other groups keep the number.
 */
const flagOffset: Parameter = {
  type: Byte,
  dependsOn: -1,
  namesBy: { [FlagGroup.CharacterInvestigated]: Character, [FlagGroup.CharacterDead]: Character },
};
/** A 0/1 byte, written as `False` / `True`. */
const bool = named(Byte, Bool);
/** A comparison operator byte, written as `==`, `!=`, `<`, `<=`, `>` or `>=`. */
const compare = named(Byte, comparisonOperators);
/** A condition joiner byte, written as `And` or `Or`. */
const join = named(Byte, LogicalJoin);

// biome-ignore format: keep the table columns aligned
/** Every known binary opcode, keyed by source name. Add a row here to teach the compiler a new one. */
export const opcodes = {
  Type:                  { id: 0x00, args: { kind: "type" } },
  LoadSprite:            { id: 0x01, args: bytes(3) },
  /** The binary text opcode. In source, `Text(...)` is sugar (see `textSugar.ts`); `RawText` is the escape hatch. */
  RawText:               { id: 0x02, args: { kind: "text" } },
  TextStyle:             { id: 0x03, args: bytes(1) },
  PostProcessingEffect:  { id: 0x04, args: bytes(4) },
  Movie:                 { id: 0x05, args: bytes(2) },
  Animation:             { id: 0x06, args: fixed([UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte]) },
  Voice:                 { id: 0x08, args: fixed([Byte, Byte, UInt16BE, Byte]) },
  Music:                 { id: 0x09, args: bytes(3) },
  Sound:                 { id: 0x0a, args: fixed([UInt16BE, Byte]) },
  SoundB:                { id: 0x0b, args: bytes(2) },
  TruthBulletFlag:       { id: 0x0c, args: bytes(2) },
  Present:               { id: 0x0d, args: bytes(3), hidden: true }, // GivePresent / ReceivePresent sugar
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
  Speaker:               { id: 0x21, args: fixed([named(Byte, Character)]) },
  ScreenFade:            { id: 0x22, args: bytes(3) },
  ObjectState:           { id: 0x23, args: bytes(5) },
  SetUI:                 { id: 0x25, args: fixed([named(Byte, UserInterface), named(Byte, UiVisibility)]) },
  SetFlag:               { id: 0x26, args: fixed([flagGroup, flagOffset, bool]) },
  OnCharacter:           { id: 0x27, args: bytes(1), block: true },
  OnObject:              { id: 0x29, args: bytes(1), block: true },
  Label:                 { id: 0x2a, args: fixed([UInt16BE]) },
  SetOption:             { id: 0x2b, args: bytes(1), block: true },
  EndOfJump:             { id: 0x2c, args: bytes(2) },
  CameraFlash:           { id: 0x2e, args: bytes(2) },
  ShowBackground:        { id: 0x30, args: fixed([UInt16BE, Byte]) },
  SetVariable:           { id: 0x33, args: fixed([Byte, Byte, UInt16BE]) },
  Goto:                  { id: 0x34, args: fixed([UInt16BE]) },
  /** `group, offset, operand, value` followed by any number of `joiner, group, offset, operand, value`. */
  IfFlag:                { id: 0x35, args: { kind: "repeat", head: [flagGroup, flagOffset, compare, bool], tail: [join, flagGroup, flagOffset, compare, bool] } },
  /** `value1, operand, value2` followed by any number of `joiner, value1, operand, value2`. */
  If:                    { id: 0x36, args: { kind: "repeat", head: [UInt16BE, compare, UInt16BE], tail: [join, UInt16BE, compare, UInt16BE] } },
  IfFreeTimeEvent:       { id: 0x38, args: fixed([UInt16BE, compare, UInt16BE]) },
  IfRelationship:        { id: 0x39, args: fixed([UInt16BE, compare, UInt16BE]) },
  WaitInput:             { id: 0x3a, args: none() },
  WaitFrame:             { id: 0x3b, args: none() },
  Then:                  { id: 0x3c, args: none() },
} as const satisfies Record<string, OpcodeRow>;

/** A binary opcode's source name. */
export type OpcodeName = keyof typeof opcodes;

/** Binary opcode ids by source name, e.g. `Opcode.RawText`. */
export const Opcode = Object.fromEntries(Object.entries(opcodes).map(([name, row]) => [name, row.id])) as {
  readonly [K in OpcodeName]: (typeof opcodes)[K]["id"];
};

/** A binary opcode id. */
export type Opcode = (typeof Opcode)[OpcodeName];
