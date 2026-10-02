import { LinscriptInstructionName } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

/**
 * Dialogue text. Source-only sugar: the compiler expands it into RawText plus the surrounding
 * TextStyle / WaitFrame / WaitInput calls.
 */
export const textInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Text,
  sugar: true,
  description:
    'Displays a line of text and waits for input; expands to RawText with TextStyle, WaitFrame and WaitInput. The text implicitly ends with a newline. Further instructions after the string, e.g. Text("...", Wait(10), SetUI(Rumble, Hidden)), run after the text prints and before the input wait.',
  parameters: [] as const,
};
