/**
 * Well-known repository paths, resolved relative to this file so scripts work
 * from any working directory and any depth inside `packages/scripts/src`.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repository root (the directory holding `packages/`, `projects/` and `workbench/`). */
export const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..");

export const WORKBENCH_DIR = join(PROJECT_ROOT, "workbench");
/** The read-only copy of the game data written by `pnpm run reset` (see `extract-linscript.ts`). */
export const EXPLORATION_DIR = join(WORKBENCH_DIR, "exploration");
