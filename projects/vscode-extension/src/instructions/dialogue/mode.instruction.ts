import { Character, characterData, isCharacter, LinscriptInstructionName, Mode } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Source-only sugar for `SetUI(Thinking, Shown|Hidden)` followed by `Speaker(character)`: who is
 * about to talk and whether in the thought bubble or aloud. The character defaults to Makoto.
 */
export const modeInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Mode,
  sugar: true,
  selfDescribing: true,
  description:
    "Starts a character's lines, either as thoughts (Thinking) or spoken aloud (Speaking); sugar for SetUI(Thinking, …) + Speaker(character). The character defaults to Makoto.",
  parameters: [
    {
      name: "mode",
      names: Mode,
    },
    {
      name: "character",
      names: Character,
      defaultValue: Character.Makoto,
    },
  ] as const,
  decorations([mode, character]) {
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown Speaker ID ${character}`, color: "gray" }];
    }
    const { name, color } = characterData[character];
    const verb = mode === Mode.Thinking ? "thinks" : "says";
    return [{ contentText: `${mode === Mode.Thinking ? "💭" : "💬"} ${name} ${verb}`, color }];
  },
};
