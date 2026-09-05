import { toHexOpcode } from "../options.js";
import { ParamType } from "../parameter.js";
import { AutoTextOpcode } from "./autoTextOpcode.js";
import { BaseOpcode } from "./baseOpcode.js";
import { EvaluateFlagOpcode } from "./evaluateFlagOpcode.js";
import { EvaluateOpcode } from "./evaluateOpcode.js";
import { TextOpcode } from "./textOpcode.js";
import { TypeOpcode } from "./typeOpcode.js";

const { Byte, UInt16BE } = ParamType;

const opcodeList: ReadonlyArray<readonly [number, BaseOpcode]> = [
  [0x00, new TypeOpcode("Type")],
  [0x01, new BaseOpcode("LoadSprite", 3)],
  [0x02, new TextOpcode("Text")],
  [0x03, new BaseOpcode("TextStyle", 1)],
  [0x04, new BaseOpcode("PostProcessingEffect", 4)],
  [0x05, new BaseOpcode("Movie", 2)],
  [0x06, new BaseOpcode("Animation", [UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte])],
  // No 0x07
  [0x08, new BaseOpcode("Voice", [Byte, Byte, UInt16BE, Byte])],
  [0x09, new BaseOpcode("Music", 3)],
  [0x0a, new BaseOpcode("Sound", [UInt16BE, Byte])],
  [0x0b, new BaseOpcode("SoundB", 2)],
  [0x0c, new BaseOpcode("TruthBulletFlag", 2)],
  [0x0d, new BaseOpcode("Present", 3)],
  [0x0e, new BaseOpcode("UnlockSkill", 2)],
  [0x0f, new BaseOpcode("StudentTitleEntry", 3)],
  [0x10, new BaseOpcode("StudentReportInfo", 3)],
  [0x11, new BaseOpcode("StudentRelationship", 4)],
  // No 0x12
  // No 0x13
  [0x14, new BaseOpcode("TrialCamera", [Byte, UInt16BE])],
  [0x15, new BaseOpcode("LoadMap", 3)],
  // No 0x16
  // No 0x17
  // No 0x18
  [0x19, new BaseOpcode("LoadScript", 3)],
  [0x1a, new BaseOpcode("StopScript", 0)],
  [0x1b, new BaseOpcode("RunScript", 3)],
  [0x1c, new BaseOpcode("RestartScript", 0)],
  [0x1e, new BaseOpcode("Sprite", 5)],
  [0x1f, new BaseOpcode("ScreenFlash", 7)],
  [0x20, new BaseOpcode("SpriteFlash", 5)],
  [0x21, new BaseOpcode("Speaker", 1)],
  [0x22, new BaseOpcode("ScreenFade", 3)],
  [0x23, new BaseOpcode("ObjectState", 5)],
  // No 0x24
  [0x25, new BaseOpcode("ChangeUI", 2)],
  [0x26, new BaseOpcode("SetVar8", 3)],
  [0x27, new BaseOpcode("CheckCharacter", 1)],
  // No 0x28
  [0x29, new BaseOpcode("CheckObject", 1)],
  [0x2a, new BaseOpcode("Label", [UInt16BE])],
  [0x2b, new BaseOpcode("SetOption", 1)],
  [0x2c, new BaseOpcode("EndOfJump", 2)],
  [0x2e, new BaseOpcode("CameraFlash", 2)],
  // No 0x2F
  [0x30, new BaseOpcode("ShowBackground", [UInt16BE, Byte])],
  // No 0x31
  // No 0x32
  [0x33, new BaseOpcode("SetVar16", [Byte, Byte, UInt16BE])],
  [0x34, new BaseOpcode("Goto", [UInt16BE])],
  [0x35, new EvaluateFlagOpcode()],
  [0x36, new EvaluateOpcode()],
  // No 0x37
  [0x38, new BaseOpcode("EvaluateFreeTimeEvent", [UInt16BE, Byte, UInt16BE])],
  [0x39, new BaseOpcode("EvaluateRelationship", [UInt16BE, Byte, UInt16BE])],
  [0x3a, new BaseOpcode("WaitInput", 0)],
  [0x3b, new BaseOpcode("WaitFrame", 0)],
  [0x3c, new BaseOpcode("IfTrue", 0)],
];

const opcodes = new Map<number, BaseOpcode>(
  opcodeList.map(([id, definition]) => {
    definition.opcode = id;
    return [id, definition];
  }),
);

/** Virtual opcodes that have no binary opcode but are used for source representation. */
const virtualOpcodes = new Map<string, BaseOpcode>([["AutoText", new AutoTextOpcode()]]);

const opcodesByName = new Map<string, number>(
  [...opcodes].map(([id, definition]) => [definition.name ?? toHexOpcode(id), id]),
);

function parseHexOpcodeName(name: string): number | null {
  if (!name.startsWith("0x")) {
    return null;
  }
  const value = Number.parseInt(name.slice(2), 16);
  if (Number.isNaN(value) || value < 0 || value > 0xff) {
    throw new Error(`Unknown opcode name: ${name}`);
  }
  return value;
}

export function getOpName(op: number): string {
  return opcodes.get(op)?.name ?? toHexOpcode(op);
}

export function getOpcodeByName(name: string): number {
  const known = opcodesByName.get(name);
  if (known !== undefined) {
    return known;
  }

  // If not found by name, try to parse as hex value (e.g. "0x1A")
  const hex = parseHexOpcodeName(name);
  if (hex !== null) {
    return hex;
  }

  throw new Error(`Unknown opcode name: ${name}`);
}

/** Byte count of an opcode's arguments, or -1 when it is variable-length or unknown. */
export function getOpcodeArgCount(op: number): number {
  const definition = opcodes.get(op);
  if (definition === undefined || definition.isVarArg) {
    return -1;
  }
  return definition.getByteCount();
}

export function getOpcodeDefinitionByName(name: string): BaseOpcode | null {
  // Try virtual opcodes first (e.g. AutoText)
  const virtual = virtualOpcodes.get(name);
  if (virtual !== undefined) {
    return virtual;
  }

  // Try to get by registered name
  const known = opcodesByName.get(name);
  if (known !== undefined) {
    return opcodes.get(known) ?? null;
  }

  // If not found by name, try to parse as hex value (e.g. "0x35")
  const hex = parseHexOpcodeName(name);
  if (hex !== null) {
    return opcodes.get(hex) ?? null;
  }

  throw new Error(`Unknown opcode name: ${name}`);
}

export function getOpcodeDefinition(op: number): BaseOpcode | null {
  return opcodes.get(op) ?? null;
}

export function getOpcodeParamTypes(op: number): ParamType[] {
  return opcodes.get(op)?.paramTypes ?? [];
}
