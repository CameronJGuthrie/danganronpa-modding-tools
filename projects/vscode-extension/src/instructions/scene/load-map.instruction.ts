import { LinscriptInstructionName, Room, roomDisplayName } from "linscript-definitions";
import type { LinscriptInstruction } from "../linscript-instruction";

/**
 * `LoadMap(room, mode, position)`, opcode 0x15. Everything below is inferred from how the 2968
 * shipped uses are placed (see `pnpm run investigate LoadMap [x,x,x]`); nothing has been tested in
 * game, and no community documentation of the opcode was found.
 *
 * The second byte is 0 or 1 in all but 14 uses, and the two values are used in different places:
 * - 0 is the scene entry load. Almost every script writes it once near the top, directly after
 *   `SetUI(BlackBackground, Hidden)`, naming the script's own room (828 of 854 story-chapter uses;
 *   the other 26 are the known aliases: the trial scripts load their chapter's trial room map
 *   217–222, the chapter 2/3 locker-room scripts load `BoysLockerRoom` 37, and the demo and
 *   crime-scene variants load their variant id).
 * - 1 is the exit transition. It sits inside `OnObject` door handlers (1009 of them directly after
 *   the handler line), followed by `SetVariable(ScriptEntryContext, …)`, a camera toggle, the
 *   `MapCharacter` roster updates and then `LoadScript` into the named room. Only 4 of 1697
 *   story-chapter uses name the script's own room. A script therefore reads `0` then one `1` per
 *   door (501 scripts with one door, 111 with two, and so on).
 * - 250 appears only in the 14 School Mode scene 602 scripts, `LoadMap(EntranceHall, 250, 0)`,
 *   before they run the character's script. Meaning unknown.
 *
 * The third byte is 255 in 2746 uses and takes two other values:
 * - 0 in the 194 School Mode (chapter 9) room entries, `LoadMap(DiningHall, 0, 0)`, where the story
 *   chapters write `(DiningHall, 0, 255)` for the same room; in the four Free Time `e08_*_050`
 *   scripts that return the player to the dining hall after a minigame; and in `LoadMap(255, 0, 0)`,
 *   which unloads the room behind a fade before a School Mode cutscene (paired with
 *   `LoadMap(248, 0, 255)`, map 248 being an uncertain id).
 * - 155 only in the six archive scripts (`e03/e05/e06_*_025`). They load `Archive` with 0 as usual,
 *   then immediately `LoadMap(Library, 1, 155)` with no `LoadScript` before entering their
 *   investigation loop. The archive is the back room of the library, so the byte looks like an
 *   entry position or camera preset inside the map, 255 being the default spot and 155 the archive's
 *   spot in the library model; School Mode's 0 would then be another fixed position.
 *
 * The bytes stay `unknown` here until one of them is changed in game and the effect observed. The
 * compiler's row is `fixed([room, Byte, Byte])` in `lin-compiler`'s `opcode.definition.ts`.
 */
export const loadMapInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.LoadMap,
  description:
    "Loads a room (map area) for exploration, e.g. LoadMap(DormHallway, 1, 255). The room is the id in the third group of the room's script name. The second argument is 0 for the scene's own room at the top of a script and 1 for the room a door handler leads to before its LoadScript; the third is almost always 255 (0 in School Mode, 155 in the archive scripts), probably an entry position. Neither is confirmed in game.",
  parameters: [
    {
      name: "room",
      description: "A Room name, or the number for rooms whose location is not yet certain",
      names: Room,
    },
    {
      // 0 = enter this room (scene entry, once per script), 1 = leave for this room (door handler,
      // followed by LoadScript). 250 appears only in School Mode scene 602. Inferred, untested.
      unknown: true,
    },
    {
      // 255 everywhere except School Mode room entries (0) and the archive's `LoadMap(Library, 1, 155)`.
      // Possibly an entry position or camera preset within the map. Inferred, untested.
      unknown: true,
    },
  ] as const,
  decorations([room]) {
    const name = roomDisplayName(room);
    return name === undefined ? `🚪 Unknown room ${room}` : `🚪 ${name}`;
  },
};
