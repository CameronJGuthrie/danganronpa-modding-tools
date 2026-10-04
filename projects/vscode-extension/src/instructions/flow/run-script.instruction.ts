import { LinscriptInstructionName, roomDisplayName, roomNamesByChapter } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

// This can point to scripts that don't seem to exist?
// E.g. getting a Monocoin RunScript(8, 30, 0) for which there is no e08_030_000.lin
export const runScriptInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.RunScript,
  description:
    "Runs another script file as a subroutine, e.g. RunScript(3, 26, 11) runs e03_026_011.lin. Ctrl+Click the call to open the file. Some targets do not exist on disk.",
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
