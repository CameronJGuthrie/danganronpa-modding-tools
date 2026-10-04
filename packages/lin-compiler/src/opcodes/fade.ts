import { FadeColour } from "linscript-definitions";
import { Opcode } from "../definitions/opcode.definition.ts";
import { nameOfValue, ParameterType, valueOfName } from "../definitions/parameter.definition.ts";
import type { ScriptEntry } from "../definitions/script.definition.ts";
import { BinaryError, SourceError } from "../errors.ts";
import { parseArg, splitArgs } from "../parameter.ts";

/**
 * `FadeIn(colour, frames)`, `FadeOut(colour, frames)` and `FadeOutThenWait(colour, frames)` are
 * source-only sugar for the binary `ScreenFade` opcode, whose bytes are `(direction, colour, frames)`.
 * The opcode moves a single full-screen curtain: direction 1 covers the screen with the colour
 * (fade out), 0 reveals it (fade in), and 101 is a fade out that finishes before the script goes
 * on. The shipped scripts write 101 only where the script is about to be left (`LoadScript`,
 * `Return`, `StopScript` or a jump to the exit label), so a 24-frame fade is not cut short by the
 * load; a plain `FadeOut` precedes an in-script change of background or sprites instead. The
 * colour is a `FadeColour` name; a fade in need not use the colour of the fade out before it, and
 * almost every script opens with `FadeOut(DefaultBlack, 1)` and later `FadeIn(Black, 24)`.
 * `ScreenFade` itself is a hidden opcode: bytes outside these three directions are an error rather
 * than a raw fallback.
 */

export const FADE_IN = "FadeIn";
export const FADE_OUT = "FadeOut";
export const FADE_OUT_THEN_WAIT = "FadeOutThenWait";

const DIRECTION: Record<string, number> = {
  [FADE_IN]: 0,
  [FADE_OUT]: 1,
  [FADE_OUT_THEN_WAIT]: 101,
};

export type FadeSugarName = typeof FADE_IN | typeof FADE_OUT | typeof FADE_OUT_THEN_WAIT;

export function isFadeSugarName(name: string): name is FadeSugarName {
  return Object.hasOwn(DIRECTION, name);
}

/** True for a binary ScreenFade entry. Whether it can be written as sugar is decided by `formatFade`. */
export function isScreenFade(entry: ScriptEntry): boolean {
  return entry.opcode === Opcode.ScreenFade;
}

/** The sugar name and argument text for a ScreenFade entry; throws when the bytes are not expressible. */
export function formatFade(entry: ScriptEntry): { name: FadeSugarName; args: string } {
  if (entry.args.length !== 3) {
    throw new BinaryError(`ScreenFade expects 3 bytes, got ${entry.args.length}`);
  }
  const [direction, colour, frames] = entry.args;
  const name = (Object.keys(DIRECTION) as FadeSugarName[]).find((key) => DIRECTION[key] === direction);
  if (name === undefined) {
    throw new BinaryError(
      `ScreenFade uses direction ${direction}; only 0 (in), 1 (out) and 101 (out then wait) are understood`,
    );
  }
  const colourName = nameOfValue(FadeColour, colour);
  if (colourName === undefined) {
    throw new BinaryError(`unknown fade colour ${colour}`);
  }
  return { name, args: `${colourName}, ${frames}` };
}

/** Compile `FadeIn(colour, frames)`, `FadeOut(colour, frames)` or `FadeOutThenWait(colour, frames)` into its ScreenFade entry. */
export function expandFade(name: FadeSugarName, argsText: string, line: number): ScriptEntry {
  const values = splitArgs(argsText);
  if (values.length !== 2) {
    throw new SourceError(line, `${name} expects 2 arguments (colour, frames), got ${values.length}`);
  }
  const colour = valueOfName(FadeColour, values[0]);
  if (colour === undefined) {
    throw new SourceError(line, `unknown fade colour '${values[0]}' for ${name}`);
  }
  return {
    opcode: Opcode.ScreenFade,
    args: [DIRECTION[name], colour, ...parseArg(ParameterType.Byte, values[1], line)],
  };
}
