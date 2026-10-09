import {
  arithmeticOperators,
  Bool,
  Chapter,
  Character,
  CharacterSprite,
  comparisonOperators,
  FlagGroup,
  flagNamesByFlagGroup,
  LogicalJoin,
  Music,
  ObjectInteraction,
  ObjectVisibility,
  Room,
  roomNamesByChapter,
  SpritePosition,
  SpriteTransition,
  Student,
  SUBROUTINE_SCENES,
  spriteNamesByCharacter,
  UiVisibility,
  uiModeNamesByUserInterface,
  UserInterface,
  Variable,
  VoiceCharacter,
} from "linscript-definitions";
import { type NamedValues, type Parameter, ParameterType } from "./parameter.definition.ts";

/** Every opcode in the compiled script data is introduced by this marker byte. */
export const OPCODE_MARKER = 0x70;

/**
 * How an opcode's arguments convert between the raw bytes on a `ScriptEntry` and the argument
 * list written in `.linscript`. `src/opcodes/arguments.ts` interprets every kind.
 */
export type ArgumentSpec =
  /**
   * A fixed layout of parameters, in source order. `binaryOrder[i]` is the binary slot that source
   * slot `i` is stored in, for opcodes whose source form reorders the bytes (`Sprite` writes the
   * slot last); absent, source and binary order are the same.
   */
  | { kind: "fixed"; layout: readonly Parameter[]; binaryOrder?: readonly number[] }
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

const { Byte, UInt16BE, UInt16LE } = ParameterType;

function fixed(layout: readonly Parameter[], binaryOrder?: readonly number[]): ArgumentSpec {
  return binaryOrder === undefined ? { kind: "fixed", layout } : { kind: "fixed", layout, binaryOrder };
}

/** A parameter whose values are written by name in source, e.g. `Speaker(Makoto)`. */
function named(type: ParameterType, names: NamedValues): Parameter {
  return { type, names };
}

/** A trailing slot source may omit; absent arguments compile to `defaultValue` (see `OptionalParameter`). */
function optional(type: ParameterType, defaultValue: number): Parameter {
  return { type, defaultValue };
}

function bytes(quantity: number): ArgumentSpec {
  return { kind: "fixed", layout: new Array<ParameterType>(quantity).fill(Byte) };
}

function none(): ArgumentSpec {
  return { kind: "fixed", layout: [] };
}

/** A flag group byte, written by name (`SceneFlags`); unknown groups stay numeric. */
const flagGroup = named(Byte, FlagGroup);
/**
 * A flag offset byte, written by name when the flag is known: the flag names in `linscript-definitions`
 * (`HandbookEnabled`, `Reset`, ...), a character id for `CharacterDead` and a skill id for the
 * skill groups. The table depends on the flag group just before it; unknown offsets keep the number.
 * `SceneFlags` slots are also named per script by `SceneFlagName(id, Name)` in the `Meta()` block.
 */
const flagOffset: Parameter = {
  type: Byte,
  dependsOn: -1,
  namesBy: flagNamesByFlagGroup,
  scopeBy: { [FlagGroup.SceneFlags]: "SceneFlag" },
};
/**
 * The mode byte of `SetUI`: `Hidden` / `Shown` for most interfaces, but a `ChooseOptionMenu` style
 * (`TwoChoice`, `YesNo`, ...) when the interface just before it is `ChooseOption`.
 */
const uiMode: Parameter = {
  type: Byte,
  dependsOn: -1,
  namesBy: uiModeNamesByUserInterface,
  otherwise: UiVisibility,
};
/** An object id byte, written by the name the script's `Meta()` block gives it, if any. */
const objectId: Parameter = { type: Byte, scope: "Object" };
/** A placed-character slot, named per script by `CharacterName(id, Name)` in the `Meta()` block. */
const characterId: Parameter = { type: Byte, scope: "Character" };
/** A menu option id byte, written by name: the defaults (`Yes`, `No`, `Exit_1`, `Exit_2`) or the script's `Meta()` entries. */
const optionId: Parameter = { type: Byte, scope: "Option" };
/** A jump label address, written by the name the script's `Meta()` block gives it with `LabelName(id, Name)`, if any. */
const labelId: Parameter = { type: UInt16BE, scope: "Label" };
/** A 0/1 byte, written as `False` / `True`. */
const bool = named(Byte, Bool);
/** A character id with bust-up sprites: the first argument of `Sprite`. */
const spriteCharacter = named(Byte, CharacterSprite);
/**
 * A sprite expression id, named per character by `spriteNamesByCharacter` (`Invisible` for the
 * transparent sprite 98; the rest stay numeric until named). The table depends on the character
 * just before it.
 */
export const spriteExpression: Parameter = { type: Byte, dependsOn: -1, namesBy: spriteNamesByCharacter };
/** The source-leading `(character, expression)` of `Sprite`, which `PlaceSprite` shares. */
export const SPRITE_HEAD: readonly Parameter[] = [spriteCharacter, spriteExpression];
/** The sprite slot byte: first in binary, written last in source so the character leads the line. */
export const spriteSlot: Parameter = Byte;
/** The binary slot of each source argument of `Sprite(character, expression, transition, position, slot)`. */
export const SPRITE_BINARY_ORDER: readonly number[] = [1, 2, 3, 4, 0];
/** An arithmetic mode byte, written as `=`, `+=` or `-=`. */
const arithmetic = named(Byte, arithmeticOperators);
/** A comparison operator byte, written as `==`, `!=`, `<`, `<=`, `>` or `>=`. */
const compare = named(Byte, comparisonOperators);
/** A condition joiner byte, written as `And` or `Or`. */
const join = named(Byte, LogicalJoin);
/** A volume byte that defaults to 100 when source leaves it out. */
const volume = optional(Byte, 100);
/** A variable id, written by name (`Scene`) when the variable is known; the value it is compared with stays numeric. */
const variable = named(UInt16BE, Variable);
/** A room (map area) id, written by its `Room` name (`DormHallway`); ids whose location is uncertain stay numeric. */
const room = named(Byte, Room);
/**
 * The third group of a script name in `LoadScript` / `RunScript`: a `Room` id when the chapter two
 * slots earlier is a story chapter, a bare index for Free Time (8) and School Mode (9) and for the
 * subroutine-library scenes (198, 199, 255) of every chapter.
 */
const scriptRoom: Parameter = {
  type: Byte,
  dependsOn: -2,
  namesBy: roomNamesByChapter,
  unless: { dependsOn: -1, values: SUBROUTINE_SCENES },
};

// biome-ignore format: keep the table columns aligned
/** Every known binary opcode, keyed by source name. Add a row here to teach the compiler a new one. */
export const opcodes = {
  Type:                  { id: 0x00, args: { kind: "type" } },
  MapState:              { id: 0x01, args: bytes(3), hidden: true }, // MapCharacter / MapIcons / MapClear* sugar (opcodes/map.ts)
  /** The binary text opcode. In source, `Text(...)` is sugar (see `textSugar.ts`); `RawText` is the escape hatch. */
  RawText:               { id: 0x02, args: { kind: "text" } },
  TextStyle:             { id: 0x03, args: bytes(1) },
  PostProcessingEffect:  { id: 0x04, args: bytes(4) },
  Movie:                 { id: 0x05, args: bytes(2) },
  Animation:             { id: 0x06, args: fixed([UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte]) },
  // The volume byte of Voice, Sound and SoundB is 100 in nearly every game script, so source may omit it
  Voice:                 { id: 0x08, args: fixed([named(Byte, VoiceCharacter), named(Byte, Chapter), UInt16BE, volume]) },
  Music:                 { id: 0x09, args: fixed([named(Byte, Music), Byte, Byte]) },
  Sound:                 { id: 0x0a, args: fixed([UInt16BE, volume]) },
  SoundB:                { id: 0x0b, args: fixed([Byte, volume]) },
  TruthBulletFlag:       { id: 0x0c, args: bytes(2) },
  Present:               { id: 0x0d, args: bytes(3), hidden: true }, // GivePresent / ReceivePresent sugar
  UnlockSkill:           { id: 0x0e, args: bytes(2) },
  StudentTitleEntry:     { id: 0x0f, args: fixed([named(Byte, Student), arithmetic, Byte]) },
  StudentReportInfo:     { id: 0x10, args: bytes(3) },
  StudentRelationship:   { id: 0x11, args: fixed([named(Byte, Student), arithmetic, UInt16BE]) },
  TrialCamera:           { id: 0x14, args: fixed([Byte, UInt16BE]) },
  LoadMap:               { id: 0x15, args: fixed([room, Byte, Byte]) },
  LoadScript:            { id: 0x19, args: fixed([Byte, Byte, scriptRoom]) },
  StopScript:            { id: 0x1a, args: bytes(0) },
  RunScript:             { id: 0x1b, args: fixed([Byte, Byte, scriptRoom]) },
  Return:                { id: 0x1c, args: bytes(0) },
  Sprite:                { id: 0x1e, args: fixed([...SPRITE_HEAD, named(Byte, SpriteTransition), named(Byte, SpritePosition), spriteSlot], SPRITE_BINARY_ORDER) },
  ScreenFlash:           { id: 0x1f, args: bytes(7) },
  SpriteFlash:           { id: 0x20, args: bytes(5) },
  Speaker:               { id: 0x21, args: fixed([named(Byte, Character)]) },
  ScreenFade:            { id: 0x22, args: bytes(3), hidden: true }, // FadeIn / FadeOut / FadeOutThenWait sugar
  ObjectState:           { id: 0x23, args: fixed([objectId, named(UInt16LE, ObjectVisibility), named(UInt16LE, ObjectInteraction)]) },
  SetUI:                 { id: 0x25, args: fixed([named(Byte, UserInterface), uiMode]) },
  SetFlag:               { id: 0x26, args: fixed([flagGroup, flagOffset, bool]) },
  OnCharacter:           { id: 0x27, args: fixed([characterId]), block: true },
  OnObject:              { id: 0x29, args: fixed([objectId]), block: true },
  Label:                 { id: 0x2a, args: fixed([labelId]) },
  SetOption:             { id: 0x2b, args: fixed([optionId]), block: true },
  DebateLabel:           { id: 0x2e, args: bytes(2), block: true, hidden: true }, // DebateStatement / OnDebate* / DebateEnd sugar (opcodes/debate.ts)
  ShowBackground:        { id: 0x30, args: fixed([UInt16BE, Byte]) },
  SetVariable:           { id: 0x33, args: fixed([named(Byte, Variable), arithmetic, UInt16BE]) },
  Goto:                  { id: 0x34, args: fixed([labelId]) },
  /** `group, offset, operand, value` followed by any number of `joiner, group, offset, operand, value`. */
  IfFlag:                { id: 0x35, args: { kind: "repeat", head: [flagGroup, flagOffset, compare, bool], tail: [join, flagGroup, flagOffset, compare, bool] } },
  /** `value1, operand, value2` followed by any number of `joiner, value1, operand, value2`. */
  If:                    { id: 0x36, args: { kind: "repeat", head: [variable, compare, UInt16BE], tail: [join, variable, compare, UInt16BE] } },
  IfFreeTimeEvent:       { id: 0x38, args: { kind: "repeat", head: [named(UInt16BE, Student), compare, UInt16BE], tail: [join, named(UInt16BE, Student), compare, UInt16BE] } }, // chained with Or in e08_010_050
  IfRelationship:        { id: 0x39, args: fixed([named(UInt16BE, Student), compare, UInt16BE]) },
  WaitInput:             { id: 0x3a, args: none() },
  WaitFrame:             { id: 0x3b, args: none() },
  Then:                  { id: 0x3c, args: none(), hidden: true }, // written as the Goto(...) argument of If* (opcodes/branch.ts)
} as const satisfies Record<string, OpcodeRow>;

/** A binary opcode's source name. */
export type OpcodeName = keyof typeof opcodes;

/** Binary opcode ids by source name, e.g. `Opcode.RawText`. */
export const Opcode = Object.fromEntries(Object.entries(opcodes).map(([name, row]) => [name, row.id])) as {
  readonly [K in OpcodeName]: (typeof opcodes)[K]["id"];
};

/** A binary opcode id. */
export type Opcode = (typeof Opcode)[OpcodeName];
