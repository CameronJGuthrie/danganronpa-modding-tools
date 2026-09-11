import {
  Character,
  isChapter,
  isCharacter,
  movies,
  musics,
  sounds,
  transitionSounds,
  voiceLinesByCharacterByChapter,
} from "linscript-definitions";
import type { ScriptLine } from "./controlFlow";

/**
 * A human-readable note for instructions that reference an asset by id, shown after the line
 * like a comment: `Sound(219, 100) # Bang`. Mirrors the VS Code extension's decorations.
 */
export function lineComment(line: ScriptLine): string | undefined {
  const [first, second, third] = line.args;
  switch (line.functionName) {
    case "Sound": {
      const id = toNumber(first);
      if (id === 65535) {
        return "Sound off";
      }
      return id === undefined ? undefined : (sounds[id]?.name ?? `Unknown sound ${id}`);
    }
    case "SoundB": {
      const id = toNumber(first);
      return id === undefined ? undefined : (transitionSounds[id]?.name ?? `Unknown sound ${id}`);
    }
    case "Music": {
      const id = toNumber(first);
      if (id === 255) {
        return "Music off";
      }
      return id === undefined ? undefined : (musics[id]?.name ?? `Unknown music ${id}`);
    }
    case "Movie": {
      const id = toNumber(first);
      return id === undefined ? undefined : (movies[id] ?? `Unknown movie ${id}`);
    }
    case "Voice": {
      const character = toNumber(first, Character);
      const chapter = toNumber(second);
      const voiceId = toNumber(third);
      if (character === undefined || !isCharacter(character)) {
        return undefined;
      }
      const name = Character[character];
      const voice =
        chapter !== undefined && isChapter(chapter) && voiceId !== undefined
          ? voiceLinesByCharacterByChapter[character]?.[chapter]?.[voiceId]
          : undefined;
      return voice === undefined ? `${name}: voice ${voiceId}` : `${name}: "${voice}"`;
    }
    default:
      return undefined;
  }
}

/** A source argument as a number, accepting a member name of `names` as well as digits. */
function toNumber(arg: string | undefined, names?: Readonly<Record<string, string | number>>): number | undefined {
  if (arg === undefined) {
    return undefined;
  }
  if (names !== undefined && typeof names[arg] === "number") {
    return names[arg] as number;
  }
  const n = Number(arg);
  return arg.trim() !== "" && !Number.isNaN(n) ? n : undefined;
}
