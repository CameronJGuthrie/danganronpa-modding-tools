import fs from "node:fs";
import path from "node:path";

/**
 * The folder of extracted game archives the Asset Preview reads textures from: the workbench's
 * `all/`. Sprite paths in `data/sprite.ts` are relative to it. Null when the workbench has not
 * been extracted.
 */
export function defaultAssetDirectory(workbenchRoot: string | null): string | null {
  if (workbenchRoot === null) {
    return null;
  }
  const directory = path.join(workbenchRoot, "all");
  return fs.existsSync(directory) ? directory : null;
}
