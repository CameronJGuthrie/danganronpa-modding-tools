import { defineEnum, type EnumValue } from "./enum.ts";

export const Chapter = defineEnum({
  Chapter_1: 1,
  Chapter_2: 2,
  Chapter_3: 3,
  Chapter_4: 4,
  Chapter_5: 5,
  Chapter_6: 6,
  /** The bonus-mode scripts (e10_*). */
  Chapter_10: 10,
  /** Not tied to a chapter, e.g. voice lines shared across the game. */
  Chapter_99: 99,
});
export type Chapter = EnumValue<typeof Chapter>;

const validChapterSet = new Set<number>(Object.values(Chapter).filter((x) => typeof x === "number"));

export function isChapter(chapterId: number): chapterId is Chapter {
  return validChapterSet.has(chapterId);
}
