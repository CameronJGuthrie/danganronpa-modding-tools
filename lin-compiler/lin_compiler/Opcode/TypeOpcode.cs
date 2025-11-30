using System;
using System.Collections.Generic;
using System.Text;

namespace LIN
{
    class TypeOpcode : BaseOpcode
    {
        public TypeOpcode(byte opcode, string name) : base(opcode, name, [Type.UInt16LE])
        {
        }

        public TypeOpcode(string name) : base(byte.MaxValue, name, [Type.UInt16LE])
        {
        }

        public override List<ScriptEntry> ReadSource(string argsString, int lineNum, Script script)
        {
            // Parse the script type and set it on the script
            argsString = argsString.Trim();

            if (argsString.Equals("Textless", StringComparison.OrdinalIgnoreCase))
            {
                script.Type = ScriptType.Textless;
            }
            else if (argsString.Equals("Text", StringComparison.OrdinalIgnoreCase))
            {
                script.Type = ScriptType.Text;
            }
            else
            {
                throw new Exception($"[read] error: Type opcode expects 'Textless' or 'Text' at line {lineNum + 1}, got '{argsString}'");
            }

            // Create the entry with a 2-byte arg array (will be filled during PrepareForCompilation)
            return [new ScriptEntry()
            {
                Opcode = Opcode,
                Args = new byte[2] // Little-endian uint16, will be filled with text count later
            }];
        }

        public override void WriteSourceArgs(StringBuilder outputBuilder, Script script, ScriptEntry scriptEntry)
        {
            if (script.Type == ScriptType.Textless)
            {
                outputBuilder.Append("Textless");
            }
            else
            {
                outputBuilder.Append("Text");
            }
        }

        public override void PrepareForCompilation(Script script, ScriptEntry entry)
        {
            // Type opcode parameter is the text entry count (little-endian)
            ushort textCount = (ushort)script.TextEntries;
            entry.Args[0] = (byte)(textCount & 0xFF);
            entry.Args[1] = (byte)(textCount >> 8);
        }
    }
}