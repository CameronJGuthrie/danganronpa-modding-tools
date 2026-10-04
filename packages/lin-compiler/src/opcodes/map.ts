import { Bool, MapCharacter } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, ParameterType, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BinaryError, SourceError } from "../errors.ts";
import { parseArg, splitArgs } from "../parameter.ts";
import { parseParameter } from "./arguments.ts";

/**
 * Source-only sugar for the binary `MapState` opcode (0x01), whose bytes are `(room, character,
 * mode)`. It maintains the roster the Monopad map and the room scripts consult: which character is
 * in which room. The room is the number of the room's script (`MapCharacter(136, Aoi, True)` puts
 * Aoi in `e01_008_136`), and the mode is `True`/`False` for present or absent; characters are
 * marked absent after they walk off or have been talked to.
 *
 * A mode above 251 turns the opcode into a reset, always written with room 255 ("all rooms"), and
 * the character byte becomes a payload rather than a character:
 *
 * - 252 `MapClearCharacterStatus()`: payload 0. Paired with `MapIcons` at every scene and day
 *   boundary, directly after the `CharacterInvestigated` flags are reset, and never before a
 *   roster or after a walk-off. Presumed to clear the per-character state the map keeps (talked
 *   to today, free-time marker). NOT TESTED IN GAME: the name is the most likely reading of its
 *   placement in the scripts, not an observed effect.
 * - 253 `MapIcons(True|False)`: payload 0 or 1. Fires on its own the moment the map is first
 *   unlocked in chapter 1, with 1 when a day of free movement begins and 0 when it ends. Presumed
 *   to toggle the character icons on the map. NOT TESTED IN GAME either.
 * - 254 `MapClearPositions()`: payload 0. Precedes a fresh roster or follows everyone leaving.
 * - 255 `MapClearAll()`: payload 0. Used three times, standing in for the other resets.
 *
 * Every one of the 2339 shipped uses is one of these five forms, so `MapState` is a hidden opcode
 * and bytes outside them are a decompile error rather than a raw fallback.
 */

const MAP_CHARACTER = "MapCharacter";
const MAP_ICONS = "MapIcons";
const MAP_CLEAR_CHARACTER_STATUS = "MapClearCharacterStatus";
const MAP_CLEAR_POSITIONS = "MapClearPositions";
const MAP_CLEAR_ALL = "MapClearAll";

/** The room byte of every reset form. */
const ALL_ROOMS = 255;

/** The mode byte of each reset form; modes 0 and 1 are the presence of `MapCharacter`. */
const RESET_MODE: Record<string, number> = {
  [MAP_CLEAR_CHARACTER_STATUS]: 252,
  [MAP_ICONS]: 253,
  [MAP_CLEAR_POSITIONS]: 254,
  [MAP_CLEAR_ALL]: 255,
};

const RESET_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(RESET_MODE).map(([name, mode]) => [mode, name]),
);

export type MapSugarName =
  | typeof MAP_CHARACTER
  | typeof MAP_ICONS
  | typeof MAP_CLEAR_CHARACTER_STATUS
  | typeof MAP_CLEAR_POSITIONS
  | typeof MAP_CLEAR_ALL;

export function isMapSugarName(name: string): name is MapSugarName {
  return name === MAP_CHARACTER || Object.hasOwn(RESET_MODE, name);
}

/** True for a binary MapState entry. Whether it can be written as sugar is decided by `formatMap`. */
export function isMapState(entry: ScriptEntry): boolean {
  return entry.opcode === Opcode.MapState;
}

/** The sugar name and argument text for a MapState entry; throws when the bytes are not expressible. */
export function formatMap(entry: ScriptEntry): { name: MapSugarName; args: string } {
  if (entry.args.length !== 3) {
    throw new BinaryError(`MapState expects 3 bytes, got ${entry.args.length}`);
  }
  const [room, character, mode] = entry.args;
  if (mode === Bool.False || mode === Bool.True) {
    if (room === ALL_ROOMS) {
      throw new BinaryError(`MapState places a character in room ${ALL_ROOMS}, which is reserved for the reset forms`);
    }
    const args = [room, nameOfValue(MapCharacter, character) ?? character, nameOfValue(Bool, mode)];
    return { name: MAP_CHARACTER, args: args.join(", ") };
  }
  const name = RESET_NAME[mode] as MapSugarName | undefined;
  if (name === undefined) {
    throw new BinaryError(`MapState mode ${mode} is not understood; only 0, 1 and 252-255 are`);
  }
  if (room !== ALL_ROOMS) {
    throw new BinaryError(`${name} (MapState mode ${mode}) expects room ${ALL_ROOMS}, got ${room}`);
  }
  if (name === MAP_ICONS) {
    const shown = nameOfValue(Bool, character);
    if (shown === undefined) {
      throw new BinaryError(`${MAP_ICONS} expects a 0 or 1 payload, got ${character}`);
    }
    return { name, args: shown };
  }
  if (character !== 0) {
    throw new BinaryError(`${name} expects a 0 payload, got ${character}`);
  }
  return { name, args: "" };
}

/** Compile one of the map sugar forms into its MapState entry. */
export function expandMap(name: MapSugarName, argsText: string, line: number): ScriptEntry {
  const values = splitArgs(argsText);
  const expect = (count: number, shape: string) => {
    if (values.length !== count) {
      throw new SourceError(line, `${name} expects ${count} argument${count === 1 ? "" : "s"}${shape}, got ${values.length}`);
    }
  };
  if (name === MAP_CHARACTER) {
    expect(3, " (room, character, present)");
    const [room] = parseArg(ParameterType.Byte, values[0], line);
    if (room === ALL_ROOMS) {
      throw new SourceError(line, `room ${ALL_ROOMS} is reserved for the map reset forms`);
    }
    const [character] = parseParameter(ParameterType.Byte, MapCharacter, values[1], line);
    const present = valueOfName(Bool, values[2]);
    if (present === undefined) {
      throw new SourceError(line, `unknown value '${values[2]}' for ${name}; expected True or False`);
    }
    return { opcode: Opcode.MapState, args: [room, character, present] };
  }
  if (name === MAP_ICONS) {
    expect(1, " (shown)");
    const shown = valueOfName(Bool, values[0]);
    if (shown === undefined) {
      throw new SourceError(line, `unknown value '${values[0]}' for ${name}; expected True or False`);
    }
    return { opcode: Opcode.MapState, args: [ALL_ROOMS, shown, RESET_MODE[name]] };
  }
  expect(0, "");
  return { opcode: Opcode.MapState, args: [ALL_ROOMS, 0, RESET_MODE[name]] };
}
