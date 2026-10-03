import { Character, characterData, isCharacter, LinscriptInstructionName, Mode } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * Source-only sugar for the UI toggles that start a character's lines followed by
 * `Speaker(character)`: who is about to talk and whether in the thought bubble or aloud (the name
 * plate shown, character defaulting to Makoto), or `System` for unattributed text with the name
 * plate hidden (character defaulting to Blank). Every mode also shows the textbox.
 */
export const modeInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Mode,
  sugar: true,
  selfDescribing: true,
  description:
    "Starts a character's lines, either as thoughts (Thinking) or spoken aloud (Speaking) with the name plate shown, or unattributed text with the name plate hidden (System); sugar for SetUI(Textbox, Shown) + SetUI(Thinking, …) + SetUI(Name, Shown) + Speaker(character), or SetUI(Textbox, Shown) + SetUI(Name, Hidden) + Speaker(Blank). The character defaults to Makoto, or Blank for System.",
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
    if (mode === Mode.System) {
      return [{ contentText: "🔈 system text, no name", color: "gray" }];
    }
    if (!isCharacter(character)) {
      return [{ contentText: `Unknown Speaker ID ${character}`, color: "gray" }];
    }
    const { name, color } = characterData[character];
    const verb = mode === Mode.Thinking ? "thinks" : "says";
    return [{ contentText: `${mode === Mode.Thinking ? "💭" : "💬"} ${name} ${verb}`, color }];
  },
};
