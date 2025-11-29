using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;

namespace LIN
{
    static class ScriptWrite
    {
        static public void WriteSource(Script s, string Filename, int indentSpaces = 2)
        {
            Program.PrintLine("[write] writing decompiled file...");

            using (var File = new System.IO.StreamWriter(Filename, false, Encoding.UTF8))
            {
                var outputBuilder = new StringBuilder();
                int setOptionIndent = 0;
                int checkObjectIndent = 0;
                int checkCharacterIndent = 0;

                // First pass: Mark opcodes to skip (those that follow Text entries)
                bool[] skipEntry = new bool[s.ScriptData.Count];
                for (int i = 0; i < s.ScriptData.Count; i++)
                {
                    ScriptEntry e = s.ScriptData[i];

                    // Check if this is a Text opcode
                    if (e.Opcode == 0x02 && e.Text != null)
                    {
                        bool hasCLTTags = System.Text.RegularExpressions.Regex.IsMatch(e.Text, @"<CLT\s+\d+>|<CLT>");

                        // Mark the TextStyle before this Text (if present and has CLT tags)
                        if (hasCLTTags && i > 0 && s.ScriptData[i - 1].Opcode == 0x03)
                        {
                            skipEntry[i - 1] = true;
                        }

                        // Mark all following WaitFrame and WaitInput opcodes after ANY Text entry
                        // Also mark TextStyle opcodes if the text has CLT tags
                        int lookAhead = i + 1;
                        while (lookAhead < s.ScriptData.Count)
                        {
                            byte nextOpcode = s.ScriptData[lookAhead].Opcode;

                            // Always skip WaitFrame (0x3B) and WaitInput (0x3A) after Text
                            // Also skip TextStyle (0x03) if Text has CLT tags
                            if (nextOpcode == 0x3B || nextOpcode == 0x3A || (hasCLTTags && nextOpcode == 0x03))
                            {
                                skipEntry[lookAhead] = true;
                                lookAhead++;
                                // Stop after WaitInput
                                if (nextOpcode == 0x3A)
                                    break;
                            }
                            else
                            {
                                break;
                            }
                        }
                    }
                }

                // Second pass: Write entries
                for (int i = 0; i < s.ScriptData.Count; i++)
                {
                    ScriptEntry e = s.ScriptData[i];

                    // Skip entries marked in first pass
                    if (skipEntry[i])
                    {
                        continue;
                    }

                    // Skip Type opcode (0x00) - it's inferred from presence of Text opcodes
                    if (e.Opcode == 0x00)
                    {
                        continue;
                    }

                    BaseOpcode opcode = OpcodeDictionary.GetOpcodeDefinition(e.Opcode);

                    // Check if this is SetOption to adjust indentation
                    if (opcode != null && opcode.Name == "SetOption")
                    {
                        // SetOption(255) closes the current level
                        if (e.Args.Length > 0 && e.Args[0] == 255)
                        {
                            setOptionIndent = 0;
                        }
                        else
                        {
                            // Any other SetOption resets to base level (not nested)
                            setOptionIndent = 0;
                        }
                    }

                    // Check if this is CheckObject to adjust indentation
                    if (opcode != null && opcode.Name == "CheckObject")
                    {
                        // CheckObject(255) closes the CheckObject indentation
                        if (e.Args.Length > 0 && e.Args[0] == 255)
                        {
                            checkObjectIndent = 0;
                        }
                        // Any other CheckObject resets to base level (not nested)
                        else if (e.Args.Length > 0)
                        {
                            checkObjectIndent = 0;
                        }
                    }

                    // Check if this is CheckCharacter to adjust indentation
                    if (opcode != null && opcode.Name == "CheckCharacter")
                    {
                        // CheckCharacter(255) closes the CheckCharacter indentation
                        if (e.Args.Length > 0 && e.Args[0] == 255)
                        {
                            checkCharacterIndent = 0;
                        }
                        // Any other CheckCharacter resets to base level (not nested)
                        else if (e.Args.Length > 0)
                        {
                            checkCharacterIndent = 0;
                        }
                    }

                    // Write indentation (additive: SetOption + CheckObject + CheckCharacter)
                    int totalIndent = setOptionIndent + checkObjectIndent + checkCharacterIndent;
                    string indent = new string(' ', totalIndent * indentSpaces);
                    outputBuilder.Append(indent);

                    if (opcode == null)
                    {
                        // Unknown opcode - write as hex with raw bytes
                        outputBuilder.Append($"0x{e.Opcode:X2}(");
                        if (e.Args.Length > 0)
                        {
                            outputBuilder.AppendJoin(", ", e.Args.Select(b => b.ToString()));
                        }
                        outputBuilder.AppendLine(")");
                    }
                    else
                    {
                        opcode.WriteSource(outputBuilder, s, e);
                    }

                    // After writing SetOption, increase indent for content (except for 255)
                    if (opcode != null && opcode.Name == "SetOption")
                    {
                        if (e.Args.Length > 0 && e.Args[0] != 255)
                        {
                            setOptionIndent = 1;
                        }
                    }

                    // After writing CheckObject, increase indent for content (except for 255)
                    if (opcode != null && opcode.Name == "CheckObject")
                    {
                        if (e.Args.Length > 0 && e.Args[0] != 255)
                        {
                            checkObjectIndent = 1;
                        }
                    }

                    // After writing CheckCharacter, increase indent for content (except for 255)
                    if (opcode != null && opcode.Name == "CheckCharacter")
                    {
                        if (e.Args.Length > 0 && e.Args[0] != 255)
                        {
                            checkCharacterIndent = 1;
                        }
                    }
                }

                File.Write(outputBuilder.ToString());
            }

            Program.PrintLine("[write] done.");
        }


        static public void WriteCompiled(Script s, string Filename)
        {
            Program.PrintLine("[write] writing compiled file...");

            // Infer script type from presence of Text opcodes
            bool hasTextOpcodes = s.ScriptData.Any(e => e.Opcode == 0x02);
            s.Type = hasTextOpcodes ? ScriptType.Text : ScriptType.Textless;

            List<byte> File =
            [
                // Header
                .. BitConverter.GetBytes((Int32)s.Type),
                .. BitConverter.GetBytes(s.Type == ScriptType.Text ? 16 : 12),
            ];
            switch (s.Type)
            {
                case ScriptType.Textless:
                    File.AddRange(BitConverter.GetBytes(s.FileSize));
                    break;
                case ScriptType.Text:
                    File.AddRange(BitConverter.GetBytes(s.TextBlockPos));
                    File.AddRange(BitConverter.GetBytes(s.FileSize));
                    break;
                default: throw new Exception("[write] error: unknown script type.");
            }

            Dictionary<int, string> TextData = [];
            if (s.Type == ScriptType.Text)
            {
                s.TextEntries = 0;
                // First pass: assign text IDs to all text opcodes
                foreach (ScriptEntry e in s.ScriptData)
                {
                    if (e.Opcode == 0x02)
                    {
                        while (TextData.ContainsKey(s.TextEntries)) s.TextEntries++;
                        TextData.Add(s.TextEntries, e.Text);

                        BaseOpcode opcode = OpcodeDictionary.GetOpcodeDefinition(e.Opcode);
                        opcode.PrepareForCompilation(s, e);
                    }
                }

                s.TextEntries = TextData.Keys.Count > 0
                    ? Math.Max(s.TextEntries, TextData.Keys.Max() + 1)
                    : 0;
            }

            // Create and insert Type opcode at the beginning
            ScriptEntry typeEntry = new ScriptEntry()
            {
                Opcode = 0x00,
                Args = new byte[2]
            };
            BaseOpcode typeOpcode = OpcodeDictionary.GetOpcodeDefinition(0x00);
            typeOpcode.PrepareForCompilation(s, typeEntry);

            // Write Type opcode first
            File.Add(0x70);
            File.Add(typeEntry.Opcode);
            File.AddRange(typeEntry.Args);

            // Write remaining opcodes (skip any existing Type opcodes from source)
            foreach (ScriptEntry e in s.ScriptData)
            {
                // Skip Type opcodes - we already wrote one at the beginning
                if (e.Opcode == 0x00)
                {
                    continue;
                }

                File.Add(0x70);
                File.Add(e.Opcode);
                File.AddRange(e.Args);
            }

            while (File.Count % 4 != 0) File.Add(0x00);

            s.TextBlockPos = File.Count;
            for (int i = 0; i < 4; i++) File[0x08 + i] = BitConverter.GetBytes(s.TextBlockPos)[i];

            if (s.Type == ScriptType.Textless)
            {
                s.FileSize = s.TextBlockPos;
            }
            else if (s.Type == ScriptType.Text)
            {
                File.AddRange(BitConverter.GetBytes(s.TextEntries));
                int[] StartPoints = new int[s.TextEntries];
                int Total = 8 + s.TextEntries * 4;

                for (int i = 0; i < s.TextEntries; i++)
                {
                    // Add the BOM
                    string Text = "\uFFFE";
                    if (TextData.ContainsKey(i)) Text = TextData[i];
                    if (Text.Length == 0 || Text[Text.Length - 1] != '\0') Text += '\0';

                    byte[] ByteText = Encoding.Unicode.GetBytes(Text);
                    if (ByteText[0] != 0xFF || ByteText[1] != 0xFE)
                    {
                        byte[] Temp = new byte[ByteText.Length + 2];
                        Temp[0] = 0xFF;
                        Temp[1] = 0xFE;
                        ByteText.CopyTo(Temp, 2);
                        ByteText = Temp;
                    }

                    StartPoints[i] = Total;
                    Total += ByteText.Length;
                }

                foreach (int sp in StartPoints)
                {
                    File.AddRange(BitConverter.GetBytes(sp));
                }
                File.AddRange(BitConverter.GetBytes(Total));

                for (int i = 0; i < s.TextEntries; i++)
                {
                    string Text = "\uFFFE";
                    if (TextData.ContainsKey(i)) Text = TextData[i];
                    if (Text.Length == 0 || Text[Text.Length - 1] != '\0') Text += '\0';

                    byte[] ByteText = Encoding.Unicode.GetBytes(Text);
                    if (ByteText[0] != 0xFF || ByteText[1] != 0xFE)
                    {
                        byte[] Temp = new byte[ByteText.Length + 2];
                        Temp[0] = 0xFF;
                        Temp[1] = 0xFE;
                        ByteText.CopyTo(Temp, 2);
                        ByteText = Temp;
                    }

                    File.AddRange(ByteText);
                }

                while (File.Count % 4 != 0) File.Add(0x00);
                s.FileSize = File.Count;
                for (int i = 0; i < 4; i++) File[0x0C + i] = BitConverter.GetBytes(s.FileSize)[i];
            }
            System.IO.File.WriteAllBytes(Filename, [.. File]);
            Program.PrintLine("[write] done.");
        }
    }
}
