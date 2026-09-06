/**
 * Well-known repository paths, resolved relative to this file so scripts work
 * from any working directory and any depth inside `projects/scripts/src`.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repository root (the directory holding `projects/` and `workspace/`). */
export const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..");

export const SCRIPTS_SRC = join(PROJECT_ROOT, "projects", "scripts", "src");
export const WORKSPACE_DIR = join(PROJECT_ROOT, "workspace");

export const LIN_COMPILER_CLI = join(PROJECT_ROOT, "projects", "lin-compiler", "src", "cli.ts");
export const WAD_ARCHIVER_CLI = join(SCRIPTS_SRC, "formats", "wad-archiver.ts");
