using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;

namespace LIN
{
    static class ScriptRead
    {
        public static bool ReadSource(Script script, string filename)
        {
            // Default script type is textless
            script.Type = ScriptType.Textless;
            Program.PrintLine("[read] reading source file...");

            string[] lines = System.IO.File.ReadAllLines(filename, Encoding.UTF8);
            List<ScriptEntry> ScriptData = [];

            // Regex pattern to match: OpcodeName(args)
            // Handles both quoted strings and regular args
            Regex opcodePattern = new Regex(@"^\s*(\w+|0x[0-9A-Fa-f]+)\s*\((.*)\)\s*$", RegexOptions.Compiled);

            for (int lineNum = 0; lineNum < lines.Length; lineNum++)
            {
                string line = lines[lineNum].Trim();
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                // Skip comment lines
                if (line.StartsWith("#"))
                {
                    continue;
                }

                Match match = opcodePattern.Match(line);
                if (!match.Success)
                {
                    throw new Exception($"[read] error: invalid syntax at line {lineNum + 1}: {line}");
                }

                string opcodeName = match.Groups[1].Value;
                string argsString = match.Groups[2].Value;

                BaseOpcode opcodeDefinition = OpcodeDictionary.GetOpcodeDefinitionByName(opcodeName);
                List<ScriptEntry> entries = opcodeDefinition.ReadSource(argsString, lineNum, script);
                ScriptData.AddRange(entries);
            }

            script.ScriptData = ScriptData;
            return true;
        }

        public static bool ReadCompiled(Script s, byte[] Bytes)
        {
            Program.PrintLine("[read] reading compiled file...");
            s.File = Bytes;
            Program.PrintLine("[read] reading header...");
            s.Type = (ScriptType)BitConverter.ToInt32(s.File, 0x0);
            s.HeaderSize = BitConverter.ToInt32(s.File, 0x4);
            switch (s.Type)
            {
                case ScriptType.Textless:
                    s.FileSize = BitConverter.ToInt32(s.File, 0x8);
                    if (s.FileSize == 0)
                        s.FileSize = s.File.Length;
                    s.TextBlockPos = s.FileSize;
                    s.ScriptData = ReadScriptData(s);
                    break;
                case ScriptType.Text:
                    s.TextBlockPos = BitConverter.ToInt32(s.File, 0x8);
                    s.FileSize = BitConverter.ToInt32(s.File, 0xC);
                    if (s.FileSize == 0)
                        s.FileSize = s.File.Length;
                    s.ScriptData = ReadScriptData(s);
                    s.TextEntries = BitConverter.ToInt32(s.File, s.TextBlockPos);
                    ReadTextEntries(s);
                    break;
                default:
                    throw new Exception("[read] error: unknown script type.");
            }

            return true;
        }

        private static List<ScriptEntry> ReadScriptData(Script s)
        {
            Program.PrintLine("[read] reading script data...");
            List<ScriptEntry> ScriptData = [];
            for (int i = s.HeaderSize; i < s.TextBlockPos; i++)
            {
                if (s.File[i] == 0x70)
                {
                    i++;
                    ScriptEntry e = new()
                    {
                        Opcode = s.File[i]
                    };

                    int ArgCount = OpcodeDictionary.GetOpcodeArgCount(e.Opcode);
                    if (ArgCount == -1)
                    {
                        // Vararg
                        List<byte> Args = [];
                        while (s.File[i + 1] != 0x70)
                        {
                            Args.Add(s.File[i + 1]);
                            i++;
                        }
                        e.Args = [.. Args];
                        ScriptData.Add(e);
                        continue;
                    }
                    else
                    {
                        e.Args = new byte[ArgCount];
                        for (int a = 0; a < e.Args.Length; a++)
                        {
                            e.Args[a] = s.File[i + 1];
                            i++;
                        }
                        ScriptData.Add(e);
                    }
                }
                else
                {
                    // EOF?
                    while (i < s.TextBlockPos)
                    {
                        if (s.File[i] != 0x00)
                        {
                            throw new Exception("[read] error: expected 0x70, got 0x" + s.File[i].ToString("X2") + ".");
                        }
                        i++;
                    }
                    return ScriptData;
                }
            }
            return ScriptData;
        }

        private static void ReadTextEntries(Script s)
        {
            Program.PrintLine("[read] reading text entries...");
            List<int> TextIDs = new(s.TextEntries);
            for (int i = 0; i < s.ScriptData.Count; i++)
            {
                if (s.ScriptData[i].Opcode == 0x02)
                {
                    byte first = s.ScriptData[i].Args[0];
                    byte second = s.ScriptData[i].Args[1];
                    // Big-endian: MSB first, LSB second (as stored in file)
                    int TextID = (first << 8) | second;

                    if (TextID >= s.TextEntries)
                    {
                        throw new Exception("[read] error: text id out of range.");
                    }

                    TextIDs.Add(TextID);
                    int TextPos = BitConverter.ToInt32(s.File, s.TextBlockPos + (TextID + 1) * 4);
                    int NextTextPos = BitConverter.ToInt32(s.File, s.TextBlockPos + (TextID + 2) * 4);
                    if (TextID == s.TextEntries - 1) NextTextPos = s.FileSize - s.TextBlockPos;

                    // Read the string from the byte array
                    string text = Encoding.Unicode.GetString(s.File, s.TextBlockPos + TextPos, NextTextPos - TextPos);

                    // Remove the BOM if present
                    if (text.StartsWith("\uFFFE"))
                    {
                        // Remove the BOM
                        text = text.Substring(1); // Skip the first character
                    }

                    // Assign the cleaned text back to the ScriptData
                    s.ScriptData[i].Text = text;
                }
                else
                {
                    s.ScriptData[i].Text = null;
                }
            }
        }

    }
}
