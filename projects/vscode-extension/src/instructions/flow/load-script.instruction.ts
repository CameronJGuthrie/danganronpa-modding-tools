import { LinscriptInstructionName, roomDisplayName, roomNamesByChapter } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

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
      description:
        "Third group of three digits: the Room the script plays in for story chapters (written by name), an index for Free Time (8) and School Mode (9)",
      namesBy: { argument: -2, tables: roomNamesByChapter },
    },
  ] as const,
  decorations([episode, scene, script]) {
    const episodePadded = `${episode}`.padStart(2, "0");
    const scenePadded = `${scene}`.padStart(3, "0");
    const scriptPadded = `${script}`.padStart(3, "0");
    const room = Object.hasOwn(roomNamesByChapter, episode) ? roomDisplayName(script) : undefined;
    const where = room === undefined ? "" : ` (${room})`;
    return `script e${episodePadded}_${scenePadded}_${scriptPadded}${where}`;
  },
};
