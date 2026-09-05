import { ParameterType } from "../definitions/parameter.definition.ts";
import { AutoTextOpcode } from "./autoTextOpcode.ts";
import { BaseOpcode } from "./baseOpcode.ts";
import { EvaluateFlagOpcode } from "./evaluateFlagOpcode.ts";
import { EvaluateOpcode } from "./evaluateOpcode.ts";
import { Opcode } from "../definitions/opcode.definition.ts";
import { TextOpcode } from "./textOpcode.ts";
import { TypeOpcode } from "./typeOpcode.ts";

const { Byte, UInt16BE } = ParameterType;

/** Every known binary opcode. Add an entry here to teach the compiler a new one. */
const opcodeList: readonly BaseOpcode[] = [
  new TypeOpcode(Opcode.Type),
  new BaseOpcode(Opcode.LoadSprite, 3),
  new TextOpcode(Opcode.Text),
  new BaseOpcode(Opcode.TextStyle, 1),
  new BaseOpcode(Opcode.PostProcessingEffect, 4),
  new BaseOpcode(Opcode.Movie, 2),
  new BaseOpcode(Opcode.Animation, [UInt16BE, Byte, Byte, Byte, Byte, Byte, Byte]),
  // No 0x07
  new BaseOpcode(Opcode.Voice, [Byte, Byte, UInt16BE, Byte]),
  new BaseOpcode(Opcode.Music, 3),
  new BaseOpcode(Opcode.Sound, [UInt16BE, Byte]),
  new BaseOpcode(Opcode.SoundB, 2),
  new BaseOpcode(Opcode.TruthBulletFlag, 2),
  new BaseOpcode(Opcode.Present, 3),
  new BaseOpcode(Opcode.UnlockSkill, 2),
  new BaseOpcode(Opcode.StudentTitleEntry, 3),
  new BaseOpcode(Opcode.StudentReportInfo, 3),
  new BaseOpcode(Opcode.StudentRelationship, 4),
  // No 0x12, 0x13
  new BaseOpcode(Opcode.TrialCamera, [Byte, UInt16BE]),
  new BaseOpcode(Opcode.LoadMap, 3),
  // No 0x16, 0x17, 0x18
  new BaseOpcode(Opcode.LoadScript, 3),
  new BaseOpcode(Opcode.StopScript, 0),
  new BaseOpcode(Opcode.RunScript, 3),
  new BaseOpcode(Opcode.RestartScript, 0),
  // No 0x1d
  new BaseOpcode(Opcode.Sprite, 5),
  new BaseOpcode(Opcode.ScreenFlash, 7),
  new BaseOpcode(Opcode.SpriteFlash, 5),
  new BaseOpcode(Opcode.Speaker, 1),
  new BaseOpcode(Opcode.ScreenFade, 3),
  new BaseOpcode(Opcode.ObjectState, 5),
  // No 0x24
  new BaseOpcode(Opcode.ChangeUI, 2),
  new BaseOpcode(Opcode.SetVar8, 3),
  new BaseOpcode(Opcode.CheckCharacter, 1),
  // No 0x28
  new BaseOpcode(Opcode.CheckObject, 1),
  new BaseOpcode(Opcode.Label, [UInt16BE]),
  new BaseOpcode(Opcode.SetOption, 1),
  new BaseOpcode(Opcode.EndOfJump, 2),
  // No 0x2d
  new BaseOpcode(Opcode.CameraFlash, 2),
  // No 0x2f
  new BaseOpcode(Opcode.ShowBackground, [UInt16BE, Byte]),
  // No 0x31, 0x32
  new BaseOpcode(Opcode.SetVar16, [Byte, Byte, UInt16BE]),
  new BaseOpcode(Opcode.Goto, [UInt16BE]),
  new EvaluateFlagOpcode(Opcode.EvaluateFlag),
  new EvaluateOpcode(Opcode.Evaluate),
  // No 0x37
  new BaseOpcode(Opcode.EvaluateFreeTimeEvent, [UInt16BE, Byte, UInt16BE]),
  new BaseOpcode(Opcode.EvaluateRelationship, [UInt16BE, Byte, UInt16BE]),
  new BaseOpcode(Opcode.WaitInput, 0),
  new BaseOpcode(Opcode.WaitFrame, 0),
  new BaseOpcode(Opcode.IfTrue, 0),
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
