import { Room } from "../room.ts";

type RoomMeta = {
  /** Display name for the GUI and editor decorations. */
  name: string;
  /** The location is a best guess from the scripts, so the id has no `Room` member and stays numeric in source. */
  uncertain?: true;
};

/**
 * Display names for the room ids (see `Room`). The names were worked out from the scripts
 * themselves (the "Leave the gym?" prompts, the room-enter narration and the investigation
 * dialogue). Every `Room` member has a row; rows marked `uncertain` are ids whose location is a
 * guess and are deliberately not members of the enum.
 */
export const rooms: Readonly<{ [roomId: number]: RoomMeta }> = {
  [Room.Hallway1F]: { name: "1F Hallway" },
  [Room.EntranceHall]: { name: "Entrance Hall" },
  [Room.GymEntrance]: { name: "Gym Entrance" },
  [Room.TrophyCase]: { name: "Trophy Display Case" },
  [Room.Gym]: { name: "Gym" },
  [Room.GymEntranceCeremony]: { name: "Gym (entrance ceremony)" },
  [Room.GymVariant]: { name: "Gym (door variant)" },
  [Room.AVRoom]: { name: "A/V Room" },
  [Room.SchoolStore]: { name: "School Store" },
  [Room.NursesOffice]: { name: "Nurse's Office" },
  [Room.NursesOfficeVariant]: { name: "Nurse's Office (door variant)" },
  [Room.Classroom1A]: { name: "Classroom 1-A" },
  [Room.Classroom1B]: { name: "Classroom 1-B" },
  [Room.Bathroom1F]: { name: "1F Bathroom" },
  [Room.DemoHallway]: { name: "Demo: Hallway" },
  [Room.Hallway2F]: { name: "2F Hallway" },
  [Room.Library]: { name: "Library" },
  [Room.LibraryVariant]: { name: "Library (door variant)" },
  [Room.Archive]: { name: "Archive" },
  [Room.GirlsLockerRoom]: { name: "Girls Locker Room" },
  [Room.BoysLockerRoomChapter2]: { name: "Boys Locker Room (Chapter 2)" },
  [Room.GirlsLockerRoomCrimeScene]: { name: "Girls Locker Room (crime scene)" },
  [Room.Pool]: { name: "Pool" },
  [Room.Classroom2A]: { name: "Classroom 2-A" },
  [Room.Classroom2B]: { name: "Classroom 2-B" },
  [Room.BoysBathroom2F]: { name: "2F Boys Bathroom" },
  [Room.BathroomStorageCloset]: { name: "Bathroom Storage Closet" },
  [Room.HiddenRoom]: { name: "Hidden Room" },
  [Room.BoysLockerRoom]: { name: "Boys Locker Room" },
  [Room.Hallway3F]: { name: "3F Hallway" },
  [Room.RecRoom]: { name: "Rec Room" },
  [Room.RecRoomCrimeScene]: { name: "Rec Room (Chapter 4 crime scene)" },
  [Room.ArtRoom]: { name: "Art Room" },
  [Room.ArtSupplyRepository]: { name: "Art Supply Repository" },
  [Room.PhysicsLab]: { name: "Physics Lab" },
  [Room.PhysicsEquipmentRoom]: { name: "Physics Equipment Room" },
  [Room.Classroom3A]: { name: "Classroom 3-A" },
  [Room.Classroom3B]: { name: "Classroom 3-B" },
  // 49 is never loaded. Its only uses are `LoadScript(3, 40, 49)` and `LoadScript(3, 38, 49)` in the
  // router script e03_000_049, and neither e03_040_049 nor e03_038_049 exists; no script loads map
  // 49 and no roster entry uses it. By the floor numbering (41–52 are 3F) it would be a 3F room.
  49: { name: "3F room (dead LoadScript target in chapter 3)?", uncertain: true },
  // 54 appears only in e04_015_041 (3F hallway, chapter 4 scene 15, Sakura's body discovery):
  // `MapCharacter(54, Kyoko, True)` / `MapCharacter(54, Aoi, True)` directly after
  // `LoadMap(Hallway3F, 0, 255)`, while the same script places both with `PlaceSprite(2, Kyoko, 0)`
  // and `PlaceSprite(3, Aoi, 0)` and the dialogue is "In the rec room...!". So the two are standing
  // in the 3F hallway but the Monopad roster is given 54, which suggests a position within the
  // hallway (outside the rec room) rather than a separate room.
  54: { name: "3F Hallway position?", uncertain: true },
  [Room.Hallway4F]: { name: "4F Hallway" },
  [Room.ChemLabVariant]: { name: "Chem Lab (door variant)" },
  [Room.ChemLab]: { name: "Chem Lab" },
  [Room.ChemLabStorage]: { name: "Chem Lab (storage shelf)" },
  [Room.StaffRoom]: { name: "Staff Room" },
  [Room.HeadmastersOffice]: { name: "Headmaster's Office" },
  [Room.MusicRoom]: { name: "Music Room" },
  [Room.DataCenter]: { name: "Data Center" },
  [Room.DataCenterInner]: { name: "Data Center (inner room)" },
  [Room.Classroom4A]: { name: "Classroom 4-A" },
  [Room.Classroom4B]: { name: "Classroom 4-B" },
  [Room.Classroom4C]: { name: "Classroom 4-C" },
  [Room.Hallway5F]: { name: "5F Hallway" },
  [Room.Garden]: { name: "Garden" },
  [Room.GardenCrimeScene]: { name: "Garden (Chapter 5 crime scene)" },
  [Room.GardenToolshed]: { name: "Garden Toolshed" },
  [Room.ChickenCoop]: { name: "Chicken Coop" },
  [Room.Dojo]: { name: "Dojo" },
  [Room.BioLab]: { name: "Bio Lab" },
  [Room.Classroom5A]: { name: "Classroom 5-A" },
  [Room.Classroom5B]: { name: "Classroom 5-B" },
  [Room.Classroom5CBloodstains]: { name: "Classroom 5-C (bloodstains)" },
  // 82 appears only in the chapter 5 scene 22 entry script e05_022_000, as the roster room of
  // Byakuya, Hiro, Aoi and Toko (`MapCharacter(82, Byakuya, True)` and three more) right before
  // `LoadScript(5, 22, Hallway5F)`. No scene 22 script places any of the four with `PlaceSprite`,
  // and the 5F hallway text (e05_022_081) is Makoto alone testing the garden key on the bio lab
  // door. 81–92 are the 5F ids, so 82 is a 5F location the roster can show but the player never
  // visits in that scene; it may be the same kind of hallway position marker as 54 and 95.
  82: { name: "5F position?", uncertain: true },
  // 95 appears only in chapter 5 scene 13: `MapCharacter(95, Hiro, True)` directly after
  // `LoadMap(Hallway5F, 0, 255)` in e05_013_081, and again in the roster list of e05_013_103
  // (`Garden` for Byakuya and Toko, `Dojo` for Aoi, 95 for Hiro). e05_013_081 is the only scene 13
  // script that places Hiro (`PlaceSprite`), so he is standing in the 5F hallway while the roster
  // is given 95, the same pattern as 54 on the 3rd floor.
  95: { name: "5F Hallway position?", uncertain: true },
  [Room.DormHallway]: { name: "Dorm Hallway" },
  [Room.MakotosRoom]: { name: "Makoto's Room" },
  [Room.MakotosRoomCrimeScene]: { name: "Makoto's Room (Chapter 1 crime scene)" },
  [Room.MakotosBathroom]: { name: "Makoto's Bathroom" },
  [Room.MakotosBathroomCrimeScene]: { name: "Makoto's Bathroom (crime scene)" },
  [Room.TakasRoom]: { name: "Taka's Room" },
  [Room.ByakuyasRoom]: { name: "Byakuya's Room" },
  [Room.MondosRoom]: { name: "Mondo's Room" },
  [Room.LeonsRoom]: { name: "Leon's Room" },
  [Room.HifumisRoom]: { name: "Hifumi's Room" },
  [Room.HirosRoom]: { name: "Hiro's Room" },
  [Room.SayakasRoom]: { name: "Sayaka's Room" },
  [Room.KyokosRoom]: { name: "Kyoko's Room" },
  [Room.AoisRoom]: { name: "Aoi's Room" },
  [Room.TokosRoom]: { name: "Toko's Room" },
  [Room.SakurasRoom]: { name: "Sakura's Room" },
  [Room.CelestesRoom]: { name: "Celeste's Room" },
  [Room.JunkosRoom]: { name: "Junko's Room" },
  [Room.ChihirosRoom]: { name: "Chihiro's Room" },
  [Room.DiningHall]: { name: "Dining Hall" },
  [Room.Kitchen]: { name: "Kitchen" },
  [Room.TrashRoom]: { name: "Trash Room" },
  [Room.Incinerator]: { name: "Incinerator" },
  [Room.LaundryRoom]: { name: "Laundry Room" },
  [Room.Warehouse]: { name: "Warehouse" },
  [Room.BathhouseDressingRoom]: { name: "Bathhouse Dressing Room" },
  [Room.DressingRoomLocker]: { name: "Dressing Room Locker (Alter Ego)" },
  [Room.Bathhouse]: { name: "Bathhouse" },
  [Room.Sauna]: { name: "Sauna" },
  [Room.BoysBathroom1F]: { name: "1F Boys Bathroom" },
  [Room.DormHallway2FRuined]: { name: "Dorm 2F Hallway (ruined)" },
  [Room.DormRoom2FRuined]: { name: "Dorm 2F Room (ruined)" },
  [Room.DormLockerRoom2F]: { name: "Dorm 2F Locker Room" },
  [Room.HeadmastersRoom]: { name: "Headmaster's Room" },
  [Room.HeadmastersRoomInner]: { name: "Headmaster's Room (inner)" },
  // 153 has two scripts, e06_000_153 and e06_007_153 (chapter 6 only). Both open with
  // `LoadMap(153, 0, 255)` then `LoadMap(DormHallway2FRuined, 1, 255)`, and their only handler is
  // the "Leave the area?" prompt that runs `LoadScript(6, 0, DormHallway2FRuined)`: no objects, no
  // characters and no narration name the place. It is therefore a room off the ruined 2F dorm
  // hallway (148) that chapter 6 lets the player step into and straight back out of; 149–152 are
  // the ruined dorm room, the locker room and the headmaster's room, which leaves this one unnamed.
  153: { name: "Dorm 2F room (ruined wing)?", uncertain: true },
  [Room.IncineratorChapter1]: { name: "Incinerator (Chapter 1)" },
  [Room.LockerDisorganized]: { name: "Locker (disorganized)" },
  [Room.LockerPocketbook]: { name: "Locker (pocketbook)" },
  // 161 appears once, in the chapter 5 scene 22 entry script e05_022_000:
  // `MapCharacter(161, MapCharacter_20, True)` as the last of four roster entries for
  // MapCharacter_20 (probably Alter Ego), after `HeadmastersOffice`, `DataCenter` and `BioLab`.
  // No script is named *_161 and nothing loads it as a map, so it is a roster-only location; it
  // sits just past the dormitory ids (101–160) and may be another position marker like 54/82/95.
  161: { name: "Alter Ego position (Chapter 5)?", uncertain: true },
  [Room.DemoTrialRoom]: { name: "Demo: Trial Room" },
  [Room.DemoMakotosRoom]: { name: "Demo: Makoto's Room" },
  [Room.ElevatorHall]: { name: "Red Door / Elevator Hall" },
  [Room.TrialRoomChapter1]: { name: "Trial Room (Chapter 1)" },
  [Room.TrialRoomChapter2]: { name: "Trial Room (Chapter 2)" },
  [Room.TrialRoomChapter3]: { name: "Trial Room (Chapter 3)" },
  [Room.TrialRoomChapter4]: { name: "Trial Room (Chapter 4)" },
  [Room.TrialRoomChapter5]: { name: "Trial Room (Chapter 5)" },
  [Room.TrialRoomChapter6]: { name: "Trial Room (Chapter 6)" },
  [Room.TrialRoomChapter3AfterExecution]: { name: "Trial Room (Chapter 3, after execution)" },
  [Room.TrialRoomChapter4AfterExecution]: { name: "Trial Room (Chapter 4, after execution)" },
  [Room.TrialRoomChapter5AfterExecution]: { name: "Trial Room (Chapter 5, after execution)" },
  [Room.TrialRoomChapter5Ending]: { name: "Trial Room (Chapter 5 ending)" },
  [Room.TrialRoomMapChapter1]: { name: "Trial Room map (Chapter 1)" },
  [Room.TrialRoomMapChapter2]: { name: "Trial Room map (Chapter 2)" },
  [Room.TrialRoomMapChapter3]: { name: "Trial Room map (Chapter 3)" },
  [Room.TrialRoomMapChapter4]: { name: "Trial Room map (Chapter 4)" },
  [Room.TrialRoomMapChapter5]: { name: "Trial Room map (Chapter 5)" },
  [Room.TrialRoomMapChapter6]: { name: "Trial Room map (Chapter 6)" },
  [Room.DemoMakotosRoomCrimeScene]: { name: "Demo: Makoto's Room (crime scene)" },
  // 248 is loaded only by School Mode (chapter 9): `LoadMap(248, 0, 255)` in every option of the
  // rest/talk menu of e09_601_000, each followed by `RunScript(9, 90, 200)` and a student's line,
  // and at the top of e09_602_100, which then places all sixteen students in a row
  // (`PlaceSprite(0, Taka, 0)`, `Sprite(1, Byakuya, 0, Set, Left)`, ...). No story chapter uses it
  // and no *_248 script exists, so it is a School Mode set where the cast gathers; which one is
  // untested in game.
  248: { name: "School Mode gathering?", uncertain: true },
  // 255 is loaded only by School Mode: `LoadMap(255, 0, 255)` after "*Sigh*" and
  // `SetUI(Textbox, Hidden)` in e09_900_016, e09_900_100 and e09_900_101, and `LoadMap(255, 0, 0)`
  // at the end of the menus in e09_600_000, e09_601_000 and e09_201_003. Nothing is loaded with it
  // afterwards and 255 is the engine's "none" elsewhere (`SetOption(255)`, `Music(Stop)`), so it
  // most likely unloads the current map rather than naming one.
  255: { name: "No map?", uncertain: true },
};

/** The display name of a room id, or undefined when it is not known. */
export function roomDisplayName(roomId: number): string | undefined {
  return rooms[roomId]?.name;
}
