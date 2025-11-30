using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace LIN
{
    class TextOpcode : BaseOpcode
    {
        public TextOpcode(byte opcode, string name) : base(opcode, name, [Type.UInt16BE])
        {
        }

        public TextOpcode(string name) : base(byte.MaxValue, name, [Type.UInt16BE])
        {
        }
        public override void WriteSourceArgs(StringBuilder outputBuilder, Script script, ScriptEntry scriptEntry)
        {
            // Text opcode: don't show the text ID, it's auto-assigned during compilation
            // Remove BOM (U+FEFF) and null terminator
            string Text = scriptEntry.Text.TrimStart('\uFEFF').TrimEnd('\0');

            // Escapes
            Text = Text.Replace("\\", "\\\\")
                        .Replace("\"", "\\\"")
                        .Replace("\r", "\\r")
                        .Replace("\n", "\\n");

            outputBuilder.Append($"\"{Text}\"");
        }

        public override List<ScriptEntry> ReadSource(string argsString, int lineNum, Script script)
        {
            // Mutate script type and increment number of entries
            script.Type = ScriptType.Text;
            script.TextEntries++;

            string text = ParseQuotedString(argsString, lineNum);

            // Text is manual - just create the Text entry without auto-generating opcodes
            return [new ScriptEntry()
            {
                Opcode = Opcode,
                Text = text,
                Args = new byte[2]
            }];
        }

        protected static string ParseQuotedString(string input, int lineNum)
        {
            input = input.Trim();

            // Must start and end with quotes
            if (!input.StartsWith("\"") || !input.EndsWith("\""))
            {
                throw new Exception($"[read] error: Text opcode expects quoted string at line {lineNum + 1}");
            }

            // Remove surrounding quotes
            string content = input.Substring(1, input.Length - 2);

            // Process escape sequences
            StringBuilder result = new();
            for (int i = 0; i < content.Length; i++)
            {
                if (content[i] == '\\' && i + 1 < content.Length)
                {
                    char next = content[i + 1];
                    switch (next)
                    {
                        case '\\':
                            result.Append('\\');
                            i++;
                            break;
                        case '"':
                            result.Append('"');
                            i++;
                            break;
                        case 'n':
                            result.Append('\n');
                            i++;
                            break;
                        case 'r':
                            result.Append('\r');
                            i++;
                            break;
                        case 't':
                            result.Append('\t');
                            i++;
                            break;
                        default:
                            result.Append(content[i]);
                            break;
                    }
                }
                else
                {
                    result.Append(content[i]);
                }
            }

            return result.ToString();
        }

        public override void PrepareForCompilation(Script script, ScriptEntry entry)
        {
            // Assign text ID for this text entry
            // Note: This is called during the first pass when building the text table
            // Big-endian: MSB first, LSB second (as required by Text opcode)
            entry.Args[0] = (byte)(script.TextEntries >> 8 & 0xFF);
            entry.Args[1] = (byte)(script.TextEntries & 0xFF);

            script.TextEntries++;
        }
    }

}