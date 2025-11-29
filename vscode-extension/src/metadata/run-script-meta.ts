import { OpcodeName } from "../enum/opcode";
import { type OpcodeMeta } from "../types/opcode-meta";

// This can point to scripts that don't seem to exist?
// E.g. getting a Monocoin RunScript(8, 30, 0) for which there is no e08_030_000.lin
export const runScriptMeta: OpcodeMeta = {
  name: OpcodeName.RunScript,
  opcode: "0x1B",
  parameters: [
    {
      name: "Episode",
      description: "First group of digits after 'e'",
    },
    {
      name: "Scene",
      description: "Second group of three digits",
    },
    {
      name: "Script",
      description: "Third group of three digits",
    },
  ] as const,
  decorations([episode, scene, script]) {
    const episodePadded = `${episode}`.padStart(2, "0");
    const scenePadded = `${scene}`.padStart(3, "0");
    const scriptPadded = `${script}`.padStart(3, "0");
    return `script e${episodePadded}_${scenePadded}_${scriptPadded}`;
  },
};
