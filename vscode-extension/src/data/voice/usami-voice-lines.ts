import { Chapter } from "../../enum/chapter";
import { ChapterVoiceLines } from ".";

export const usamiVoiceLines: ChapterVoiceLines = {
  [Chapter.Chapter_1]: undefined,
  [Chapter.Chapter_2]: undefined,
  [Chapter.Chapter_3]: undefined,
  [Chapter.Chapter_4]: undefined,
  [Chapter.Chapter_5]: undefined,
  [Chapter.Chapter_6]: undefined,
  // I'm not certain about these being in the right chapter.
  [Chapter.Chapter_99]: {
    metadata: { index: 6476 },
    2: "dr1_voice_hca_us.awb.06477.ogg | Got it?",
    5: "dr1_voice_hca_us.awb.06480.ogg | That's right!",
    6: "dr1_voice_hca_us.awb.06481.ogg | Got it?",
    7: "dr1_voice_hca_us.awb.06482.ogg | Everyone!",
    10: "dr1_voice_hca_us.awb.06485.ogg | Ummm...",
    18: "dr1_voice_hca_us.awb.06493.ogg | Hm?",
    24: "dr1_voice_hca_us.awb.06499.ogg | Ta-da!",
    31: "dr1_voice_hca_us.awb.06506.ogg | Ta-da!",
    39: "dr1_voice_hca_us.awb.06514.ogg | I won't forgive you.",
    40: "dr1_voice_hca_us.awb.06515.ogg | Hey, hey!",
    43: "dr1_voice_hca_us.awb.06518.ogg | Wait!",
    44: "dr1_voice_hca_us.awb.06519.ogg | I won't forgive you.",
    47: "dr1_voice_hca_us.awb.06522.ogg | Ha-ha-ha-ha-ha-ha-ha!",
    51: "dr1_voice_hca_us.awb.06526.ogg | Love, love.",
    68: "dr1_voice_hca_us.awb.06543.ogg | YEAH!",
    69: "dr1_voice_hca_us.awb.06544.ogg | Disappear!",
  }
};