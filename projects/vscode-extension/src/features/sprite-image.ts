import * as fs from "node:fs";
import * as path from "node:path";
import { characterData, isCharacterSprite, sprites } from "linscript-definitions";
import { argumentNames } from "../util/argument-names";
import { lookupInstruction } from "../util/call-at";
import { getArgumentsFromFunctionLike } from "../util/string-util";
import { cropPngFromFirstVisibleRow } from "../util/png-crop";
import { getWorkbenchRoot } from "./workspace";

/**
 * The bust-up image behind a `Sprite(...)` / `PlaceSprite(...)` line, shared by Ctrl+Click (which
 * opens it) and the hover (which shows it). The game's textures are `stand_CC_EE.tga`; a mod may
 * carry its own copy, and `pnpm run reset --convert image` replaces each extracted `.tga` with a
 * `.tga.png`, which is the only form the hover can render.
 */

/** The character and expression of a `Sprite` / `PlaceSprite` call, names resolved; undefined for other lines. */
export function spriteArgumentsOfLine(
  lineText: string,
  document: string,
): { character: number; expression: number } | undefined {
  const match = /^\s*(Sprite|PlaceSprite)\s*\(.*\)/.exec(lineText);
  if (match === null) {
    return undefined;
  }
  const instruction = lookupInstruction(match[1]);
  if (instruction === undefined) {
    return undefined;
  }
  const callText = match[0].trimStart();
  const args = getArgumentsFromFunctionLike(callText, argumentNames(instruction, callText, document));
  const character = args[0]?.value;
  const expression = args[1]?.value;
  if (character === undefined || expression === undefined || Number.isNaN(character) || Number.isNaN(expression)) {
    return undefined;
  }
  return { character, expression };
}

/** `stand_CC_EE.tga`, the texture's name in the game data. */
export function spriteTextureName(character: number, expression: number): string {
  return `stand_${String(character).padStart(2, "0")}_${String(expression).padStart(2, "0")}.tga`;
}

/**
 * Where the sprite's image is on disk: the mod's own texture first, then the extracted game
 * texture as a `.tga.png` conversion or, failing that, the raw `.tga`. Null when none exists or
 * the workbench is not configured.
 */
export function findSpriteImagePath(character: number, expression: number): string | null {
  const rootDir = getWorkbenchRoot();
  if (!rootDir) {
    return null;
  }
  const filename = spriteTextureName(character, expression);
  const explorationDir = path.join(rootDir, "exploration/wad_dr1_data/Dr1/data/all/texture");
  const candidates = [
    path.join(rootDir, "mods/default/dr1_data/Dr1/data/all/texture", filename),
    path.join(explorationDir, `${filename}.png`),
    path.join(explorationDir, filename),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

/** "Makoto: Neutral", or the numbers when the character or expression has no name. */
export function spriteLabel(character: number, expression: number): string {
  const name = isCharacterSprite(character) ? characterData[character].name : `character ${character}`;
  const expressionName = sprites[character as keyof typeof sprites]?.[expression] ?? `expression ${expression}`;
  return `${name}: ${expressionName}`;
}

/**
 * A copy of the sprite's PNG cropped to `height` rows from its first visible row, the head,
 * written once into `cacheDir` and reused. Null when the source is not a PNG or cannot be cropped.
 */
export function spriteHeadImagePath(imagePath: string, height: number, cacheDir: string): string | null {
  if (!imagePath.endsWith(".png")) {
    return null;
  }
  const target = path.join(cacheDir, `${path.basename(imagePath, ".png")}.head${height}.png`);
  try {
    if (!fs.existsSync(target) || fs.statSync(target).mtimeMs < fs.statSync(imagePath).mtimeMs) {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(target, cropPngFromFirstVisibleRow(fs.readFileSync(imagePath), height));
    }
    return target;
  } catch {
    return null;
  }
}
