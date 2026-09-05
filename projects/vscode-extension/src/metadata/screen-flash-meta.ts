import { OpcodeName } from "../enum/opcode";
import type { OpcodeMeta } from "../types/opcode-meta";

export const screenFlashMeta: OpcodeMeta = {
  name: OpcodeName.ScreenFlash,
  hexcode: "0x1F",
  parameters: [
    {
      name: "R",
      description: "Red 0-255",
    },
    {
      name: "G",
      description: "Green 0-255",
    },
    {
      name: "B",
      description: "Blue 0-255",
    },
    {
      name: "in",
      description: "Duration in frames",
    },
    {
      name: "hold",
      description: "Duration in frames",
    },
    {
      name: "out",
      description: "Duration in frames",
    },
    {
      name: "opacity",
      description: "Opacity 0-255. Always 255",
    },
  ] as const,
  decorations([r, g, b, inFrames, holdFrames, outFrames, _opacity]) {
    const red = r.toString(16).padStart(2, "0");
    const green = g.toString(16).padStart(2, "0");
    const blue = b.toString(16).padStart(2, "0");

    const fadeInDurationSeconds = (inFrames / 60).toFixed(2);
    const holdDurationSeconds = (holdFrames / 60).toFixed(2);
    const fadeOutDurationSeconds = (outFrames / 60).toFixed(2);

    return [
      {
        contentText: `${fadeInDurationSeconds}s->[${holdDurationSeconds}s]->${fadeOutDurationSeconds}s`,
        color: `#${red}${green}${blue}`,
      },
    ];
  },
};
