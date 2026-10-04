import { defineEnum, type EnumValue } from "./enum.ts";

/**
 * The rooms (map areas) by the id `LoadMap` loads. The same id is the third group of a scene
 * script's name (`e01_008_136` plays in room 136), the room of `MapCharacter`, and the third
 * argument of `LoadScript` / `RunScript` when the chapter is a story chapter.
 *
 * Only rooms identified with confidence from the scripts are named here; ids whose location is
 * a guess stay numeric in source (see `uncertain` in `data/room-data.ts`). Ids group by floor:
 * 1–19 school 1F, 21–40 2F, 41–52 3F, 61–72 4F, 81–92 5F, 101–160 the dormitory wing, 200+ the
 * trial grounds. Where one location has several ids (crime-scene variants, chapter-specific
 * layouts) the variant is suffixed to the name.
 */
export const Room = defineEnum({
  Hallway1F: 1,
  EntranceHall: 3,
  GymEntrance: 4,
  TrophyCase: 5,
  Gym: 6,
  GymEntranceCeremony: 7,
  /** Only ever the map of a door transition into the Gym (chapter 1 scene 24); the Gym script then loads `Gym`. */
  GymVariant: 8,
  AVRoom: 9,
  SchoolStore: 10,
  NursesOffice: 11,
  /** Only ever the map of a door transition into the Nurse's Office (chapter 3 scene 40); the script then loads `NursesOffice`. */
  NursesOfficeVariant: 13,
  Classroom1A: 14,
  Classroom1B: 15,
  Bathroom1F: 16,
  DemoHallway: 18,
  Hallway2F: 21,
  Library: 22,
  /** Only ever the map of a door transition into the Library in chapters 3 and 4; the Library script then loads `Library`. */
  LibraryVariant: 23,
  Archive: 25,
  GirlsLockerRoom: 26,
  BoysLockerRoomChapter2: 27,
  GirlsLockerRoomCrimeScene: 29,
  Pool: 30,
  Classroom2A: 31,
  Classroom2B: 32,
  BoysBathroom2F: 33,
  BathroomStorageCloset: 35,
  HiddenRoom: 36,
  BoysLockerRoom: 37,
  Hallway3F: 41,
  RecRoom: 42,
  RecRoomCrimeScene: 43,
  ArtRoom: 44,
  ArtSupplyRepository: 46,
  PhysicsLab: 47,
  PhysicsEquipmentRoom: 48,
  Classroom3A: 51,
  Classroom3B: 52,
  Hallway4F: 61,
  /** Only ever the map of a door transition into the Chem Lab in chapters 5 and 6; the Chem Lab script then loads `ChemLab`. */
  ChemLabVariant: 62,
  ChemLab: 63,
  ChemLabStorage: 64,
  StaffRoom: 65,
  HeadmastersOffice: 66,
  MusicRoom: 67,
  DataCenter: 68,
  DataCenterInner: 69,
  Classroom4A: 70,
  Classroom4B: 71,
  Classroom4C: 72,
  Hallway5F: 81,
  Garden: 83,
  GardenCrimeScene: 84,
  GardenToolshed: 85,
  ChickenCoop: 86,
  Dojo: 87,
  BioLab: 89,
  Classroom5A: 90,
  Classroom5B: 91,
  Classroom5CBloodstains: 92,
  DormHallway: 101,
  MakotosRoom: 103,
  MakotosRoomCrimeScene: 104,
  MakotosBathroom: 105,
  MakotosBathroomCrimeScene: 106,
  // The students' dorm rooms are 105 + 2 * character id. Byakuya, Hiro, Sayaka, Kyoko, Aoi, Toko,
  // Sakura and Chihiro are confirmed by the scripts' map roster; the others follow the pattern and
  // are never referenced by a shipped script.
  TakasRoom: 107,
  ByakuyasRoom: 109,
  MondosRoom: 111,
  LeonsRoom: 113,
  HifumisRoom: 115,
  HirosRoom: 117,
  SayakasRoom: 119,
  KyokosRoom: 121,
  AoisRoom: 123,
  TokosRoom: 125,
  SakurasRoom: 127,
  CelestesRoom: 129,
  JunkosRoom: 131,
  ChihirosRoom: 133,
  DiningHall: 135,
  Kitchen: 136,
  TrashRoom: 137,
  Incinerator: 138,
  LaundryRoom: 139,
  Warehouse: 140,
  BathhouseDressingRoom: 141,
  DressingRoomLocker: 142,
  Bathhouse: 144,
  Sauna: 145,
  BoysBathroom1F: 146,
  DormHallway2FRuined: 148,
  DormRoom2FRuined: 149,
  DormLockerRoom2F: 150,
  HeadmastersRoom: 151,
  HeadmastersRoomInner: 152,
  IncineratorChapter1: 156,
  LockerDisorganized: 157,
  LockerPocketbook: 158,
  DemoTrialRoom: 159,
  DemoMakotosRoom: 160,
  ElevatorHall: 201,
  TrialRoomChapter1: 203,
  TrialRoomChapter2: 204,
  TrialRoomChapter3: 205,
  TrialRoomChapter4: 206,
  TrialRoomChapter5: 207,
  TrialRoomChapter6: 208,
  TrialRoomChapter3AfterExecution: 211,
  TrialRoomChapter4AfterExecution: 213,
  TrialRoomChapter5AfterExecution: 214,
  TrialRoomChapter5Ending: 216,
  // The trial room's map per chapter. Trial scripts (203–208 and their variants) load these at
  // their start rather than their own id; 220 is also a script in chapter 4 scene 19 and 217 the
  // demo's trial script.
  TrialRoomMapChapter1: 217,
  TrialRoomMapChapter2: 218,
  TrialRoomMapChapter3: 219,
  TrialRoomMapChapter4: 220,
  TrialRoomMapChapter5: 221,
  TrialRoomMapChapter6: 222,
  /** Only ever the map of the demo's transition into Makoto's crime-scene room; the script then loads `MakotosRoomCrimeScene`. */
  DemoMakotosRoomCrimeScene: 244,
});
export type Room = EnumValue<typeof Room>;

const roomIds: ReadonlySet<number> = new Set(Object.values(Room).filter((value) => typeof value === "number"));

export function isRoom(id: number): id is Room {
  return roomIds.has(id);
}

/**
 * Chapters (the `e<nn>` prefix / first argument of `LoadScript` and `RunScript`) whose scripts
 * play in a room, so their third name group is a `Room` id. Free Time (8) and School Mode (9)
 * reuse that slot as an index, so their ids are not rooms.
 */
export const ROOM_CHAPTERS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 10];

/**
 * Scenes whose scripts are subroutine libraries shared by a chapter rather than rooms: `RunScript(4, 255, 3)`
 * runs the third subroutine of chapter 4, so the third argument is an index, not a `Room`, when the
 * scene is one of these.
 */
export const SUBROUTINE_SCENES: readonly number[] = [198, 199, 255];

/**
 * The name table for the third argument of `LoadScript` / `RunScript`, keyed by the chapter in
 * the first argument: `Room` for story chapters and nothing for the index-based ones.
 */
export const roomNamesByChapter: Readonly<Record<number, Readonly<Record<string, string | number>>>> =
  Object.fromEntries(ROOM_CHAPTERS.map((chapter) => [chapter, Room]));
