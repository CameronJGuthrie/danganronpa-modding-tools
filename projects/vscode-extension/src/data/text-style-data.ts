import { TextStyle } from "linscript-definitions";

export const textStyleColor: Readonly<Record<TextStyle, string>> = {
  [TextStyle.Default]: "#ffffff",
  [TextStyle.Choice]: "#dd31cb",
  [TextStyle.Keyword]: "#f5d502",
  [TextStyle.Thought]: "#5fcde3",
  // Evidence and Shout only appear in class trials; these colours are placeholders until checked in game
  [TextStyle.Evidence]: "#ff9f43",
  [TextStyle.PaleGreen]: "#8fdcb4",
  [TextStyle.Red]: "#d67f66",
  [TextStyle.System]: "#5ae138",
  [TextStyle.Shout]: "#ff4d4d",
};
