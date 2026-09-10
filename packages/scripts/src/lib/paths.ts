/**
 * Well-known repository paths, resolved relative to this file so scripts work
 * from any working directory and any depth inside `packages/scripts/src`.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repository root (the directory holding `packages/`, `projects/` and `workbench/`). */
export const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..");

export const SCRIPTS_SRC = join(PROJECT_ROOT, "packages", "scripts", "src");
export const WORKBENCH_DIR = join(PROJECT_ROOT, "workbench");

export const LIN_COMPILER_CLI = join(PROJECT_ROOT, "projects", "cli", "src", "cli.ts");
export const WAD_ARCHIVER_CLI = join(SCRIPTS_SRC, "formats", "wad-archiver.ts");
