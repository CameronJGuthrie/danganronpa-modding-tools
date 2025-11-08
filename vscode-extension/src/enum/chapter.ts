export enum Chapter {
    Chapter_1 = 1,
    Chapter_2 = 2,
    Chapter_3 = 3,
    Chapter_4 = 4,
    Chapter_5 = 5,
    Chapter_6 = 6,
    Chapter_99 = 99,
}

const validChapterSet = new Set(Object.values(Chapter).filter(x => typeof x === "number"));

export function isChapter(chapterId: number): chapterId is Chapter {
  return validChapterSet.has(chapterId);
}