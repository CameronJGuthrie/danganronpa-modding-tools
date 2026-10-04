import { rooms } from "linscript-definitions";

/**
 * What a script's filename says about where it plays. Names are `e<chapter>_<scene>_<room>`, and
 * the room is the id `LoadMap` loads for that area, so every script in a room shares it. The room
 * names live in `linscript-definitions` (`Room` and `rooms`), shared with the compiler and the
 * editor; the chapter names below are only used here. Free Time (e08) and School Mode (e09)
 * scripts reuse the room slot as an index rather than a location, so their labels are not
 * meaningful and are left out.
 */

/** The chapter a script's `e<nn>` prefix stands for. */
export const chapterNames: Readonly<Record<number, string>> = {
  0: "Prologue",
  1: "Chapter 1",
  2: "Chapter 2",
  3: "Chapter 3",
  4: "Chapter 4",
  5: "Chapter 5",
  6: "Chapter 6",
  7: "Epilogue",
  8: "Free Time",
  9: "School Mode",
  10: "Demo",
};

/** Chapters whose room slot is an index rather than a location; see the module comment. */
const ROOMLESS_CHAPTERS: ReadonlySet<number> = new Set([8, 9]);

export type ScriptName = { chapter: number; scene: number; room: number };

/** Split `e01_001_007` (with or without `.linscript`) into its parts; undefined for other names. */
export function parseScriptName(name: string): ScriptName | undefined {
  const match = /^e(\d+)_(\d+)_(\d+)(?:\.linscript)?$/.exec(name.replace(/^.*\//, ""));
  if (match === null) {
    return undefined;
  }
  return { chapter: Number(match[1]), scene: Number(match[2]), room: Number(match[3]) };
}

/** The room a script plays in, or undefined when the name is not a scene script or the room is unknown. */
export function roomName(name: string): string | undefined {
  const parsed = parseScriptName(name);
  if (parsed === undefined || ROOMLESS_CHAPTERS.has(parsed.chapter)) {
    return undefined;
  }
  return rooms[parsed.room]?.name;
}

/** A one-line description for headers: `Chapter 1 · scene 1 · Gym (room 7)`. */
export function describeScript(name: string): string | undefined {
  const parsed = parseScriptName(name);
  if (parsed === undefined) {
    return undefined;
  }
  const chapter = chapterNames[parsed.chapter] ?? `e${parsed.chapter}`;
  const room = roomName(name);
  const where = room === undefined ? `room ${parsed.room}` : `${room} (room ${parsed.room})`;
  return `${chapter} · scene ${parsed.scene} · ${where}`;
}
