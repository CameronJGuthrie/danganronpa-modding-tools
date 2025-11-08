using System;
using System.Collections.Generic;
using System.Text;

namespace LIN
{
    /// <summary>
    /// Opcode 0x35 - EvaluateFlag
    /// Format: byte byte byte count [variable bytes - flag checking logic]
    /// The count byte and remaining bytes form a complex flag-checking structure
    /// </summary>
    class EvaluateFlagOpcode : BaseOpcode
    {
        public EvaluateFlagOpcode() : base("EvaluateFlag")
        {
            IsVarArg = true;
        }

        protected override void WriteSourceArgs(StringBuilder output, Script script, ScriptEntry scriptEntry)
        {
            byte[] args = scriptEntry.Args;
            if (args.Length < 4)
            {
                // Shouldn't happen, but handle gracefully
                base.WriteSourceArgs(output, script, scriptEntry);
                return;
            }

            List<string> argStrings = new List<string>();

            // First 3 fixed bytes
            argStrings.Add(args[0].ToString());
            argStrings.Add(args[1].ToString());
            argStrings.Add(args[2].ToString());

            // Count byte
            byte count = args[3];
            argStrings.Add(count.ToString());

            // Variable arguments - just output all remaining bytes
            for (int i = 4; i < args.Length; i++)
            {
                argStrings.Add(args[i].ToString());
            }

            output.AppendJoin(", ", argStrings);
        }

        protected override byte[] ParseOpcodeArgs(string argsString, int lineNum)
        {
            argsString = argsString.Trim();

            if (string.IsNullOrWhiteSpace(argsString))
            {
                throw new Exception($"[read] error: EvaluateFlag requires at least 4 arguments at line {lineNum + 1}");
            }

            string[] argStrings = argsString.Split(',');
            for (int i = 0; i < argStrings.Length; i++)
            {
                argStrings[i] = argStrings[i].Trim();
            }

            if (argStrings.Length < 4)
            {
                throw new Exception($"[read] error: EvaluateFlag requires at least 4 arguments at line {lineNum + 1}");
            }

            List<byte> argBytes = new List<byte>();

            // Parse first 3 fixed bytes
            for (int i = 0; i < 3; i++)
            {
                if (!byte.TryParse(argStrings[i], out byte value))
                {
                    throw new Exception($"[read] error: invalid byte value '{argStrings[i]}' at line {lineNum + 1}");
                }
                argBytes.Add(value);
            }

            // Parse count
            if (!byte.TryParse(argStrings[3], out byte count))
            {
                throw new Exception($"[read] error: invalid count value '{argStrings[3]}' at line {lineNum + 1}");
            }
            argBytes.Add(count);

            // Parse remaining arguments (variable length based on flag logic)
            for (int i = 4; i < argStrings.Length; i++)
            {
                if (!byte.TryParse(argStrings[i], out byte value))
                {
                    throw new Exception($"[read] error: invalid byte value '{argStrings[i]}' at line {lineNum + 1}");
                }
                argBytes.Add(value);
            }

            return argBytes.ToArray();
        }
    }
}
