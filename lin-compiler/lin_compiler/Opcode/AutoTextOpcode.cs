using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace LIN
{
    /// <summary>
    /// Auto-Text opcode - generates WaitFrame/WaitInput automatically based on newlines.
    /// This is syntactic sugar that expands to Text + WaitFrame(s) + WaitInput.
    /// </summary>
    class AutoTextOpcode : TextOpcode
    {
        public AutoTextOpcode() : base("AutoText")
        {
        }

        public override List<ScriptEntry> ReadSource(string argsString, int lineNum, Script script)
        {
            // Mutate script type and increment number of entries
            script.Type = ScriptType.Text;
            script.TextEntries++;

            string text = ParseQuotedString(argsString, lineNum);

            // Check if text contains CLT tags
            if (Regex.IsMatch(text, @"<CLT\s+\d+>|<CLT>"))
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
                    Opcode = 0x02, // Text opcode
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

        private List<ScriptEntry> ParseCLTTags(string text, int lineNum)
        {
            List<ScriptEntry> entries = [];

            // Pattern to match <CLT N>, <CLT> (closing), and actual newline characters
            Regex cltPattern = new Regex(@"<CLT\s+(\d+)>|<CLT>|\n");

            MatchCollection matches = cltPattern.Matches(text);

            // If no matches, just create a simple Text entry with WaitInput
            if (matches.Count == 0)
            {
                entries.Add(new ScriptEntry()
                {
                    Opcode = 0x02,
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
                Opcode = 0x02,
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
