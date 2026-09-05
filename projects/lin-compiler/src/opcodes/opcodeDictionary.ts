import { ParamType } from "../parameter.ts";
import { AutoTextOpcode } from "./autoTextOpcode.ts";
import { BaseOpcode } from "./baseOpcode.ts";
import { EvaluateFlagOpcode } from "./evaluateFlagOpcode.ts";
import { EvaluateOpcode } from "./evaluateOpcode.ts";
import { OP_TEXT, OP_TEXT_STYLE, OP_TYPE, OP_WAIT_FRAME, OP_WAIT_INPUT } from "./ids.ts";
import { TextOpcode } from "./textOpcode.ts";
import { TypeOpcode } from "./typeOpcode.ts";

const { Byte, UInt16BE } = ParamType;

/** Every known binary opcode. Add an entry here to teach the compiler a new one. */
const opcodeList: readonly BaseOpcode[] = [
  new TypeOpcode(OP_TYPE, "Type"),
  new BaseOpcode(0x01, "LoadSprite", 3),
  new TextOpcode(OP_TEXT, "Text"),
  new BaseOpcode(OP_TEXT_STYLE, "TextStyle", 1),
  new BaseOpcode(0x04, "PostProcessingEffect", 4),
  new BaseOpcode(0x05, "Movie", 2),
  new BaseOpcode(0x06, "Animation", [UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte]),
  // No 0x07
  new BaseOpcode(0x08, "Voice", [Byte, Byte, UInt16BE, Byte]),
  new BaseOpcode(0x09, "Music", 3),
  new BaseOpcode(0x0a, "Sound", [UInt16BE, Byte]),
  new BaseOpcode(0x0b, "SoundB", 2),
  new BaseOpcode(0x0c, "TruthBulletFlag", 2),
  new BaseOpcode(0x0d, "Present", 3),
  new BaseOpcode(0x0e, "UnlockSkill", 2),
  new BaseOpcode(0x0f, "StudentTitleEntry", 3),
  new BaseOpcode(0x10, "StudentReportInfo", 3),
  new BaseOpcode(0x11, "StudentRelationship", 4),
  // No 0x12, 0x13
  new BaseOpcode(0x14, "TrialCamera", [Byte, UInt16BE]),
  new BaseOpcode(0x15, "LoadMap", 3),
  // No 0x16, 0x17, 0x18
  new BaseOpcode(0x19, "LoadScript", 3),
  new BaseOpcode(0x1a, "StopScript", 0),
  new BaseOpcode(0x1b, "RunScript", 3),
  new BaseOpcode(0x1c, "RestartScript", 0),
  // No 0x1d
  new BaseOpcode(0x1e, "Sprite", 5),
  new BaseOpcode(0x1f, "ScreenFlash", 7),
  new BaseOpcode(0x20, "SpriteFlash", 5),
  new BaseOpcode(0x21, "Speaker", 1),
  new BaseOpcode(0x22, "ScreenFade", 3),
  new BaseOpcode(0x23, "ObjectState", 5),
  // No 0x24
  new BaseOpcode(0x25, "ChangeUI", 2),
  new BaseOpcode(0x26, "SetVar8", 3),
  new BaseOpcode(0x27, "CheckCharacter", 1),
  // No 0x28
  new BaseOpcode(0x29, "CheckObject", 1),
  new BaseOpcode(0x2a, "Label", [UInt16BE]),
  new BaseOpcode(0x2b, "SetOption", 1),
  new BaseOpcode(0x2c, "EndOfJump", 2),
  // No 0x2d
  new BaseOpcode(0x2e, "CameraFlash", 2),
  // No 0x2f
  new BaseOpcode(0x30, "ShowBackground", [UInt16BE, Byte]),
  // No 0x31, 0x32
  new BaseOpcode(0x33, "SetVar16", [Byte, Byte, UInt16BE]),
  new BaseOpcode(0x34, "Goto", [UInt16BE]),
  new EvaluateFlagOpcode(0x35, "EvaluateFlag"),
  new EvaluateOpcode(0x36, "Evaluate"),
  // No 0x37
  new BaseOpcode(0x38, "EvaluateFreeTimeEvent", [UInt16BE, Byte, UInt16BE]),
  new BaseOpcode(0x39, "EvaluateRelationship", [UInt16BE, Byte, UInt16BE]),
  new BaseOpcode(OP_WAIT_INPUT, "WaitInput", 0),
  new BaseOpcode(OP_WAIT_FRAME, "WaitFrame", 0),
  new BaseOpcode(0x3c, "IfTrue", 0),
];

/** Source-only opcodes that expand to binary ones when compiled. */
const virtualOpcodes: readonly BaseOpcode[] = [new AutoTextOpcode()];

const byId = new Map(opcodeList.map((opcode) => [opcode.id, opcode]));
const byName = new Map([...opcodeList, ...virtualOpcodes].map((opcode) => [opcode.name, opcode]));

export function getOpcode(id: number): BaseOpcode | undefined {
  return byId.get(id);
}

/** Look up an opcode by its source name, accepting `0xNN` for registered ids. */
export function getOpcodeByName(name: string): BaseOpcode | undefined {
  const hexId = parseHexOpcodeName(name);
  return hexId === undefined ? byName.get(name) : byId.get(hexId);
}

/** The `0xNN` form used for opcodes with no name. */
export function hexOpcodeName(id: number): string {
  return `0x${id.toString(16).toUpperCase().padStart(2, "0")}`;
}

/** Inverse of `hexOpcodeName`; undefined when `name` is not of that form. */
export function parseHexOpcodeName(name: string): number | undefined {
  return /^0x[0-9a-f]{1,2}$/i.test(name) ? Number.parseInt(name.slice(2), 16) : undefined;
}
