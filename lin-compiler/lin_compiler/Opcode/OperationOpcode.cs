using System;
using System.Collections.Generic;
using System.Text;

namespace LIN
{
    /// <summary>
    /// Opcode 0x36 - Operation
    /// Variable-length opcode for operations/calculations
    /// </summary>
    class EvaluateOpcode : BaseOpcode
    {
        public EvaluateOpcode() : base("Evaluate")
        {
            IsVarArg = true;
        }

        protected override void WriteSourceArgs(StringBuilder output, Script script, ScriptEntry scriptEntry)
        {
            byte[] args = scriptEntry.Args;
            if (args.Length == 0)
            {
                return;
            }

            // Format: First expression: [UInt16BE, operand, UInt16BE] (5 bytes)
            //         Additional expressions: [joiner, UInt16BE, operand, UInt16BE] (6 bytes each)
            List<string> argStrings = new List<string>();

            int i = 0;

            // First expression (5 bytes)
            if (i + 4 < args.Length)
            {
                // Read first 16-bit big-endian value
                ushort value1 = (ushort)((args[i] << 8) | args[i + 1]);

                // Read operand
                byte operand = args[i + 2];

                // Read second 16-bit big-endian value
                ushort value2 = (ushort)((args[i + 3] << 8) | args[i + 4]);

                argStrings.Add(value1.ToString());
                argStrings.Add(operand.ToString());
                argStrings.Add(value2.ToString());

                i += 5;
            }

            // Additional expressions (6 bytes each)
            while (i < args.Length)
            {
                if (i + 5 < args.Length)
                {
                    // Read joiner
                    byte joiner = args[i];

                    // Read first 16-bit big-endian value
                    ushort value1 = (ushort)((args[i + 1] << 8) | args[i + 2]);

                    // Read operand
                    byte operand = args[i + 3];

                    // Read second 16-bit big-endian value
                    ushort value2 = (ushort)((args[i + 4] << 8) | args[i + 5]);

                    argStrings.Add(joiner.ToString());
                    argStrings.Add(value1.ToString());
                    argStrings.Add(operand.ToString());
                    argStrings.Add(value2.ToString());

                    i += 6;
                }
                else
                {
                    // Shouldn't happen, but output remaining bytes as-is
                    argStrings.Add(args[i].ToString());
                    i++;
                }
            }

            output.AppendJoin(", ", argStrings);
        }

        protected override byte[] ParseOpcodeArgs(string argsString, int lineNum)
        {
            argsString = argsString.Trim();

            if (string.IsNullOrWhiteSpace(argsString))
            {
                return [];
            }

            string[] argStrings = argsString.Split(',');
            for (int j = 0; j < argStrings.Length; j++)
            {
                argStrings[j] = argStrings[j].Trim();
            }

            // First expression: 3 args (value1, operand, value2)
            // Additional expressions: 4 args each (joiner, value1, operand, value2)
            // Total: 3 + (n * 4) where n >= 0
            if (argStrings.Length < 3 || (argStrings.Length - 3) % 4 != 0)
            {
                throw new Exception($"[read] error: Evaluate expects 3 + (n * 4) arguments at line {lineNum + 1}");
            }

            List<byte> argBytes = new List<byte>();
            int i = 0;

            // Parse first expression (3 args)
            if (!ushort.TryParse(argStrings[i], out ushort value1))
            {
                throw new Exception($"[read] error: invalid 16-bit value '{argStrings[i]}' at line {lineNum + 1}");
            }

            if (!byte.TryParse(argStrings[i + 1], out byte operand))
            {
                throw new Exception($"[read] error: invalid operand value '{argStrings[i + 1]}' at line {lineNum + 1}");
            }

            if (!ushort.TryParse(argStrings[i + 2], out ushort value2))
            {
                throw new Exception($"[read] error: invalid 16-bit value '{argStrings[i + 2]}' at line {lineNum + 1}");
            }

            // Write first expression as big-endian bytes
            argBytes.Add((byte)(value1 >> 8));     // MSB of value1
            argBytes.Add((byte)(value1 & 0xFF));   // LSB of value1
            argBytes.Add(operand);
            argBytes.Add((byte)(value2 >> 8));     // MSB of value2
            argBytes.Add((byte)(value2 & 0xFF));   // LSB of value2

            i += 3;

            // Parse additional expressions (4 args each)
            while (i < argStrings.Length)
            {
                if (!byte.TryParse(argStrings[i], out byte joiner))
                {
                    throw new Exception($"[read] error: invalid joiner value '{argStrings[i]}' at line {lineNum + 1}");
                }

                if (!ushort.TryParse(argStrings[i + 1], out value1))
                {
                    throw new Exception($"[read] error: invalid 16-bit value '{argStrings[i + 1]}' at line {lineNum + 1}");
                }

                if (!byte.TryParse(argStrings[i + 2], out operand))
                {
                    throw new Exception($"[read] error: invalid operand value '{argStrings[i + 2]}' at line {lineNum + 1}");
                }

                if (!ushort.TryParse(argStrings[i + 3], out value2))
                {
                    throw new Exception($"[read] error: invalid 16-bit value '{argStrings[i + 3]}' at line {lineNum + 1}");
                }

                // Write as big-endian bytes
                argBytes.Add(joiner);
                argBytes.Add((byte)(value1 >> 8));     // MSB of value1
                argBytes.Add((byte)(value1 & 0xFF));   // LSB of value1
                argBytes.Add(operand);
                argBytes.Add((byte)(value2 >> 8));     // MSB of value2
                argBytes.Add((byte)(value2 & 0xFF));   // LSB of value2

                i += 4;
            }

            return argBytes.ToArray();
        }
    }
}
