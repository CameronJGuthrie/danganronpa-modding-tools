import fs from "node:fs";
import path from "node:path";

/**
 * The folder of extracted game archives the Asset Preview reads textures from: the repository's
 * `workbench/all`, found relative to the app (which lives in `projects/gui`). Sprite paths in
 * `data/sprite.ts` are relative to it. Null when the workbench has not been extracted.
 */
export function defaultAssetDirectory(appPath: string): string | null {
  const candidates = [path.resolve(appPath, "../../workbench/all"), path.resolve(appPath, "../../../workbench/all")];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}
