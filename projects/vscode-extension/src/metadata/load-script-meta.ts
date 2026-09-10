import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

export const loadScriptMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.LoadScript,
  hexcode: "0x19",
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
