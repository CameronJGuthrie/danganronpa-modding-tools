/**
 * What a script's filename says about where it plays. Names are `e<chapter>_<scene>_<room>`, and
 * the room is the id `LoadMap` loads for that area, so every script in a room shares it. The
 * names below were worked out from the scripts themselves (the "Leave the gym?" prompts, the
 * room-enter narration and the investigation dialogue) and live only here; the `.linscript`
 * files carry nothing but the number.
 *
 * Ids group by floor: 1–19 school 1F, 21–40 2F, 41–52 3F, 61–72 4F, 81–92 5F, 101–160 the
 * dormitory wing, 200+ the trial grounds. A `?` marks a best guess. Free Time (e08) and School
 * Mode (e09) scripts reuse the room slot as an index rather than a location, so their labels are
 * not meaningful and are left out.
 */
export const roomNames: Readonly<Record<number, string>> = {
  1: "1F Hallway",
  3: "Entrance Hall",
  4: "Gym Entrance",
  5: "Trophy Display Case",
  6: "Gym",
  7: "Gym (entrance ceremony)",
  9: "A/V Room",
  10: "School Store",
  11: "Nurse's Office",
  14: "Classroom 1-A",
  15: "Classroom 1-B",
  18: "Demo: Hallway",
  21: "2F Hallway",
  22: "Library",
  25: "Archive",
  26: "Girls Locker Room",
  27: "Boys Locker Room (Chapter 2)",
  29: "Girls Locker Room (crime scene)",
  30: "Pool",
  31: "Classroom 2-A",
  32: "Classroom 2-B",
  33: "2F Boys Bathroom",
  35: "Bathroom Storage Closet",
  36: "Hidden Room",
  37: "Boys Locker Room",
  41: "3F Hallway",
  42: "Rec Room",
  43: "Rec Room (Chapter 4 crime scene)",
  44: "Art Room",
  46: "Art Supply Repository",
  47: "Physics Lab",
  48: "Physics Equipment Room",
  51: "Classroom 3-A",
  52: "Classroom 3-B",
  61: "4F Hallway",
  63: "Chem Lab",
  64: "Chem Lab (storage shelf)",
  65: "Staff Room",
  66: "Headmaster's Office",
  67: "Music Room",
  68: "Data Center",
  69: "Data Center (inner room)",
  70: "Classroom 4-A",
  71: "Classroom 4-B",
  72: "Classroom 4-C?",
  81: "5F Hallway",
  83: "Garden",
  84: "Garden (Chapter 5 crime scene)",
  85: "Garden Toolshed",
  86: "Chicken Coop",
  87: "Dojo",
  89: "Bio Lab",
  90: "Classroom 5-A",
  91: "Classroom 5-B",
  92: "Classroom 5-C (bloodstains)",
  101: "Dorm Hallway",
  103: "Makoto's Room",
  104: "Makoto's Room (Chapter 1 crime scene)",
  105: "Makoto's Bathroom",
  106: "Makoto's Bathroom (crime scene)",
  117: "Hiro's Room",
  119: "Sayaka's Room",
  121: "Kyoko's Room",
  123: "Aoi's Room?",
  135: "Dining Hall",
  136: "Kitchen",
  137: "Trash Room",
  138: "Incinerator",
  139: "Laundry Room",
  140: "Warehouse",
  141: "Bathhouse Dressing Room",
  142: "Dressing Room Locker (Alter Ego)",
  144: "Bathhouse",
  145: "Sauna",
  146: "Dorm Lobby (fish tank)",
  148: "Dorm 2F Hallway (ruined)",
  149: "Dorm 2F Room (ruined)",
  150: "Dorm 2F Locker Room",
  151: "Headmaster's Room",
  152: "Headmaster's Room (inner)",
  156: "Incinerator (Chapter 1)",
  157: "Locker (disorganized)",
  158: "Locker (pocketbook)",
  159: "Demo: Trial Room",
  160: "Demo: Makoto's Room",
  201: "Red Door / Elevator Hall",
  203: "Trial Room (Chapter 1)",
  204: "Trial Room (Chapter 2)",
  205: "Trial Room (Chapter 3)",
  206: "Trial Room (Chapter 4)",
  207: "Trial Room (Chapter 5)",
  208: "Trial Room (Chapter 6)",
  211: "Trial Room (Chapter 3, after execution)",
  213: "Trial Room (Chapter 4, after execution)",
  214: "Trial Room (Chapter 5, after execution)",
  216: "Trial Room (Chapter 5 ending)",
  217: "Demo: Trial Room",
  220: "Trial Room (Chapter 4 opening)",
};

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
  return roomNames[parsed.room];
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
