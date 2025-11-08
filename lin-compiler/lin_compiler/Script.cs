using System;
using System.Collections.Generic;

namespace LIN
{
    enum ScriptType
    {
        Textless = 1,
        Text = 2,
    }

    class ScriptEntry
    {
        public byte Opcode;
        public byte[] Args;
        public string Text;
    }

    class Script
    {
        public byte[] File;
        public ScriptType Type;
        public int HeaderSize;
        public int FileSize;
        public int TextBlockPos;
        public List<ScriptEntry> ScriptData;
        public int TextEntries;

        public Script(string filename, bool compiled = true)
        {
            if (compiled)
            {
                if (!ScriptRead.ReadCompiled(this, System.IO.File.ReadAllBytes(filename)))
                {
                    throw new Exception("[load] error: failed to load script.");
                }
            }
            else
            {
                if (!ScriptRead.ReadSource(this, filename))
                {
                    throw new Exception("[load] error: failed to load script.");
                }
            }
        }
    }
}
