import { isTextStyle, LinscriptInstructionName, TextStyle } from "linscript-definitions";
import { textStyleColor } from "../data/text-style-data";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";

/**
 * This is no longer required when using Text(""), as the compiler will insert them correctly automatically
 * E.g. when you use Text("<choice>Pink Text</choice>")
 * You may still insert extra TextStyle(n) calls if you want.
 */
export const textStyleMeta: LinscriptInstructionMeta = {
  name: LinscriptInstructionName.TextStyle,
  hexcode: "0x03",
  parameters: [
    {
      name: "styleId",
      description: `
        Sets the text style/color for subsequent text display.
        Works in conjunction with the <thought>...</thought> style tags embedded in text strings.
        StyleId 0 resets to default, other values apply different colors/fonts/sizes.
        `,
      names: TextStyle,
      values: {
        [TextStyle.Default]: { name: "Default", description: "Reset to default (white) text" },
        [TextStyle.Choice]: { name: "Choice", description: "Pink; selectable answer words in brackets" },
        [TextStyle.Keyword]: { name: "Keyword", description: "Yellow; items, places and interface terms" },
        [TextStyle.Thought]: { name: "Thought", description: "Cyan; Makoto's inner monologue" },
        [TextStyle.Evidence]: { name: "Evidence", description: "Class trial weak point (unverified)" },
        [TextStyle.PaleGreen]: { name: "Pale green" },
        [TextStyle.Red]: { name: "Red" },
        [TextStyle.System]: { name: "System", description: "Green; tutorial, narrator and sound effects" },
        [TextStyle.Shout]: { name: "Shout", description: "Class trial outbursts (unverified)" },
      },
    },
  ] as const,
  decorations([styleId]) {
    if (!isTextStyle(styleId)) {
      return `⚠️ Unknown style: ${styleId}`;
    }
    const color = textStyleColor[styleId];
    return [
      {
        contentText: `● ${styleId}`,
        color: color,
      },
    ];
  },
};
