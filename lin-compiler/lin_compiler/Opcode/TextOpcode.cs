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
        protected override void WriteSourceArgs(StringBuilder outputBuilder, Script script, ScriptEntry scriptEntry)
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

            // Check if text contains CLT tags
            if (System.Text.RegularExpressions.Regex.IsMatch(text, @"<CLT\s+\d+>|<CLT>"))
            {
                // Parse CLT tags and generate opcodes
                return ParseCLTTags(text, lineNum);
            }
            else
            {
                // No CLT tags - generate Text with WaitFrame for each \n and WaitInput at end
                List<ScriptEntry> entries = [];

                entries.Add(new ScriptEntry()
                {
                    Opcode = Opcode,
                    Text = text,
                    Args = new byte[2]
                });

                // Count newlines and add WaitFrame for each
                int newlineCount = text.Count(c => c == '\n');
                for (int i = 0; i < newlineCount; i++)
                {
                    entries.Add(new ScriptEntry()
                    {
                        Opcode = 0x3B, // WaitFrame
                        Args = []
                    });
                }

                // Add WaitInput at the end
                entries.Add(new ScriptEntry()
                {
                    Opcode = 0x3A, // WaitInput
                    Args = []
                });

                return entries;
            }
        }

        private static string ParseQuotedString(string input, int lineNum)
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

        private List<ScriptEntry> ParseCLTTags(string text, int lineNum)
        {
            List<ScriptEntry> entries = [];

            // Pattern to match <CLT N>, <CLT> (closing), and actual newline characters
            // Group 1: number for opening tag
            Regex cltPattern = new Regex(@"<CLT\s+(\d+)>|<CLT>|\n");

            MatchCollection matches = cltPattern.Matches(text);

            // If no matches, just create a simple Text entry with WaitInput
            if (matches.Count == 0)
            {
                entries.Add(new ScriptEntry()
                {
                    Opcode = Opcode,
                    Text = text,
                    Args = new byte[2]
                });
                entries.Add(new ScriptEntry()
                {
                    Opcode = 0x3A, // WaitInput
                    Args = []
                });
                return entries;
            }

            // Extract the first CLT style number to set before Text
            Match firstMatch = matches[0];
            int initialStyle = 0;
            if (firstMatch.Groups[1].Success)
            {
                initialStyle = int.Parse(firstMatch.Groups[1].Value);
            }

            // Add initial TextStyle before Text
            entries.Add(new ScriptEntry()
            {
                Opcode = 0x03, // TextStyle
                Args = [(byte)initialStyle]
            });

            // Add the Text entry (with CLT tags preserved)
            entries.Add(new ScriptEntry()
            {
                Opcode = Opcode,
                Text = text,
                Args = new byte[2]
            });

            // Process all matches to generate TextStyle and WaitFrame opcodes
            foreach (Match match in matches)
            {
                if (match.Value == "<CLT>")
                {
                    // <CLT> without number - closing tag, reset style to 0
                    entries.Add(new ScriptEntry()
                    {
                        Opcode = 0x03, // TextStyle
                        Args = [0]
                    });
                }
                else if (match.Value == "\n")
                {
                    // Newline - add WaitFrame
                    entries.Add(new ScriptEntry()
                    {
                        Opcode = 0x3B, // WaitFrame
                        Args = []
                    });
                }
                else if (match.Groups[1].Success)
                {
                    // <CLT N> opening tag - but skip the first one since we already handled it
                    if (match.Index > firstMatch.Index)
                    {
                        int styleNum = int.Parse(match.Groups[1].Value);
                        entries.Add(new ScriptEntry()
                        {
                            Opcode = 0x03, // TextStyle
                            Args = [(byte)styleNum]
                        });
                    }
                }
            }

            // Add WaitInput at the end
            entries.Add(new ScriptEntry()
            {
                Opcode = 0x3A, // WaitInput
                Args = []
            });

            return entries;
        }

    }

}