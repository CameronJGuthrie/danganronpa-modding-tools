using System;
using System.Collections.Generic;
using System.Linq;

namespace LIN
{

    class OpcodeDictionary
    {
        private static readonly Dictionary<byte, BaseOpcode> opcodes = new Dictionary<byte, BaseOpcode>
        {
            { 0x00, new TypeOpcode("Type") },
            { 0x01, new BaseOpcode("LoadSprite", 3) },
            { 0x02, new TextOpcode("Text") },
            { 0x03, new BaseOpcode("TextStyle", 1) },
            { 0x04, new BaseOpcode("PostProcessingEffect", 4) },
            { 0x05, new BaseOpcode("Movie", 2) },
            { 0x06, new BaseOpcode("Animation", Type.UInt16BE, Type.Byte, Type.Byte, Type.Byte, Type.Byte, Type.Byte, Type.Byte) },
            { 0x08, new BaseOpcode("Voice", [Type.Byte, Type.Byte, Type.UInt16BE, Type.Byte]) },
            { 0x09, new BaseOpcode("Music", 3) },
            { 0x0A, new BaseOpcode("Sound", [Type.UInt16BE, Type.Byte]) },
            { 0x0B, new BaseOpcode("SoundB", 2) },
            { 0x0C, new BaseOpcode("TruthBulletFlag", 2) },
            { 0x0D, new BaseOpcode("Present", 3) },
            { 0x0E, new BaseOpcode("UnlockSkill", 2) },
            { 0x0F, new BaseOpcode("StudentTitleEntry", 3) },
            { 0x10, new BaseOpcode("StudentReportInfo", 3) },
            { 0x11, new BaseOpcode("StudentRelationship", 4) },
            { 0x14, new BaseOpcode("TrialCamera", 3) },
            { 0x15, new BaseOpcode("LoadMap", 3) },
            { 0x19, new BaseOpcode("LoadScript", 3) },
            { 0x1A, new BaseOpcode("StopScript", 0) },
            { 0x1B, new BaseOpcode("RunScript", 3) },
            { 0x1C, new BaseOpcode("RestartScript", 0) },
            { 0x1E, new BaseOpcode("Sprite", 5) },
            { 0x1F, new BaseOpcode("ScreenFlash", 7) },
            { 0x20, new BaseOpcode("SpriteFlash", 5) },
            { 0x21, new BaseOpcode("Speaker", 1) },
            { 0x22, new BaseOpcode("ScreenFade", 3) },
            { 0x23, new BaseOpcode("ObjectState", 5) },
            { 0x25, new BaseOpcode("ChangeUI", 2) },
            { 0x26, new BaseOpcode("SetVar8", 3) },
            { 0x27, new BaseOpcode("CheckCharacter", 1) },
            { 0x29, new BaseOpcode("CheckObject", 1) },
            { 0x2A, new BaseOpcode("Label", Type.UInt16BE) },
            { 0x2B, new BaseOpcode("SetOption", 1) },
            { 0x2C, new BaseOpcode("EndOfJump", 2) },
            { 0x2E, new BaseOpcode("CameraFlash", 2) },
            // No 0x2F
            { 0x30, new BaseOpcode("ShowBackground", Type.UInt16BE, Type.Byte) },
            // No 0x31
            // No 0x32
            { 0x33, new BaseOpcode("SetVar16", Type.Byte, Type.Byte, Type.UInt16BE) },
            { 0x34, new BaseOpcode("Goto", Type.UInt16BE) },
            { 0x35, new EvaluateFlagOpcode() },
            { 0x36, new EvaluateOpcode() },
            // No 0x37
            { 0x38, new BaseOpcode("EvaluateFreeTimeEvent", Type.UInt16BE, Type.Byte, Type.UInt16BE) },
            { 0x39, new BaseOpcode("EvaluateRelationship", Type.UInt16BE, Type.Byte, Type.UInt16BE) },
            { 0x3A, new BaseOpcode("WaitInput", 0) },
            { 0x3B, new BaseOpcode("WaitFrame", 0) },
            { 0x3C, new BaseOpcode("IfTrue", 0) },
        }.ToDictionary(kvp => kvp.Key, kvp => { kvp.Value.Opcode = kvp.Key; return kvp.Value; });

        private static readonly Dictionary<string, byte> opcodesByName = opcodes
            .ToDictionary(
                kv => kv.Value.Name ?? $"0x{kv.Key:X2}",
                kv => kv.Key);

        public static string GetOpName(byte op)
        {
            if (opcodes.TryGetValue(op, out BaseOpcode value))
            {
                return value.Name ?? $"0x{op:X2}";
            }

            return $"0x{op:X2}";
        }

        public static byte GetOpcodeByName(string name)
        {
            if (opcodesByName.TryGetValue(name, out byte opcode))
            {
                return opcode;
            }

            // If not found by name, try to parse as hex value (e.g., "0x1A")
            if (name.StartsWith("0x"))
            {
                return byte.Parse(name.Substring(2), System.Globalization.NumberStyles.HexNumber);
            }

            throw new Exception($"Unknown opcode name: {name}");
        }

        public static int GetOpcodeArgCount(byte op)
        {
            var def = GetOpcodeDefinition(op);
            if (def != null)
            {
                if (def.IsVarArg)
                    return -1;
                return def.GetByteCount();
            }
            return -1;
        }

        public static BaseOpcode GetOpcodeDefinitionByName(string name)
        {
            // Try to get by registered name first
            if (opcodesByName.TryGetValue(name, out byte opcode))
            {
                return opcodes[opcode];
            }

            // If not found by name, try to parse as hex value (e.g., "0x35")
            if (name.StartsWith("0x"))
            {
                byte opcodeValue = byte.Parse(name.Substring(2), System.Globalization.NumberStyles.HexNumber);
                return opcodes.GetValueOrDefault(opcodeValue, null);
            }

            throw new Exception($"Unknown opcode name: {name}");
        }

        public static BaseOpcode GetOpcodeDefinition(byte op)
        {
            return opcodes.GetValueOrDefault(op, null);
        }

        public static Type[] GetOpcodeParamTypes(byte op)
        {
            var def = GetOpcodeDefinition(op);
            return def?.ParamTypes ?? [];
        }
    }
}
