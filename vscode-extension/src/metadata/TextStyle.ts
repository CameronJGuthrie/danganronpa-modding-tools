import { textStyleColor } from "../data/text-style-data";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";
import { isTextStyle } from "../enum/text-style";

export const textStyle: OpcodeMeta = {
  name: OpcodeName.TextStyle,
  opcode: "0x03",
  parameters: [
    {
      name: "styleId",
      description: `
        Sets the text style/color for subsequent text display.
        Works in conjunction with <CLT N> tags embedded in text strings.
        StyleId 0 resets to default, other values apply different colors/fonts/sizes.
        `,
      values: {
        0: {
          name: "Default/Reset",
          description: "Reset to default text style",
        },
        1: { name: "Pink", description: "Pink text color" },
        3: { name: "Yellow", description: "Yellow text color" },
        4: { name: "Cyan", description: "Cyan text color" },
        10: { name: "Light Green", description: "Light green text color" },
        11: { name: "Orange", description: "Orange/coral text color" },
        23: {
          name: "Green (SFX)",
          description: "Green text for sound effects",
        },
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
