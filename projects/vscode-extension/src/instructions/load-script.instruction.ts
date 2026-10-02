import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const loadScriptInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.LoadScript,
  description:
    "Switches to another script file, e.g. LoadScript(3, 26, 11) loads e03_026_011.lin, and is usually followed by StopScript(). Ctrl+Click the call to open the file.",
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
