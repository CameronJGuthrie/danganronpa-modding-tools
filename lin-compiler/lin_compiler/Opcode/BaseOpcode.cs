using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace LIN
{
    class BaseOpcode(byte opcode, string name, params Type[] paramTypes)
    {
        public string Name = name;
        public byte Opcode = opcode;
        public Type[] ParamTypes = paramTypes ?? [];
        public bool IsVarArg = false;

        // Constructor for simple byte-only opcodes
        public BaseOpcode(byte opcode, string name, int byteCount) : this(opcode, name, [.. Enumerable.Repeat(Type.Byte, byteCount)])
        {
        }

        // Constructor with opcode defaulting to 0xFF
        public BaseOpcode(string name, params Type[] paramTypes) : this(byte.MaxValue, name, paramTypes)
        {
        }

        // Constructor with opcode defaulting to 0xFF
        public BaseOpcode(string name, int byteCount) : this(byte.MaxValue, name, [.. Enumerable.Repeat(Type.Byte, byteCount)])
        {
        }

        // Constructor with just byte count, name will be hex representation
        public BaseOpcode(int byteCount) : this(byte.MaxValue, null, [.. Enumerable.Repeat(Type.Byte, byteCount)])
        {
        }

        // Constructor with just param types, name will be hex representation
        public BaseOpcode(params Type[] paramTypes) : this(byte.MaxValue, null, paramTypes)
        {
        }

        public int GetByteCount()
        {
            int count = 0;
            foreach (var type in ParamTypes)
            {
                count += Parameter.CountBytes(type);
            }
            return count;
        }

        public void WriteSource(StringBuilder output, Script script, ScriptEntry scriptEntry)
        {
            string opcodeName = Program.UseHexOpcodes ? $"0x{Opcode:X2}" : (Name ?? $"0x{Opcode:X2}");
            output.Append(opcodeName);
            output.Append('(');
            WriteSourceArgs(output, script, scriptEntry);
            output.AppendLine(")");
        }

        protected virtual void WriteSourceArgs(StringBuilder output, Script script, ScriptEntry scriptEntry)
        {
            byte[] argValues = scriptEntry.Args;
            if (argValues.Length == 0)
            {
                return;
            }

            List<string> args = [];
            int byteIndex = 0;

            foreach (var paramType in paramTypes)
            {
                args.Add(Parameter.FormatValue(paramType, argValues, ref byteIndex));
            }
            output.AppendJoin(", ", args);
        }

        public virtual List<ScriptEntry> ReadSource(string argsString, int lineNum, Script script)
        {
            return [new ScriptEntry()
            {
                Opcode = Opcode,
                Args = ParseOpcodeArgs(argsString, lineNum),
            }];
        }
        
        protected virtual byte[] ParseOpcodeArgs(string argsString, int lineNum)
        {
            argsString = argsString.Trim();

            // Empty args
            if (string.IsNullOrWhiteSpace(argsString))
            {
                return [];
            }

            // Split by comma
            string[] argStrings = argsString.Split(',');
            for (int i = 0; i < argStrings.Length; i++)
            {
                argStrings[i] = argStrings[i].Trim();
            }

            // Convert arguments to bytes based on parameter types
            List<byte> argBytes = [];

            int argIndex = 0;
            foreach (var paramType in ParamTypes)
            {
                if (argIndex >= argStrings.Length)
                {
                    throw new Exception($"[read] error: not enough arguments at line {lineNum + 1}");
                }

                Parameter.ParseValue(paramType, argStrings[argIndex], argBytes, lineNum);
                argIndex++;
            }

            return [.. argBytes];
        }

        // Called during compilation to prepare the entry for writing
        // Override this method for opcodes that need special preparation (e.g., text ID assignment)
        public virtual void PrepareForCompilation(Script script, ScriptEntry entry)
        {
            // Default: no special preparation needed
        }

    };
}