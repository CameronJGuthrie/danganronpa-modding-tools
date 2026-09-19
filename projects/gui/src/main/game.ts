import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DANGANRONPA_APP_ID = "413410";

export type RunGameResult = {
  /** True when the mod build succeeded and the game launch was started. */
  ok: boolean;
  /** Combined stdout and stderr of the build, for the log view. */
  output: string;
};

/** The repository root, found relative to the app (which lives in `projects/gui`). */
function repositoryRoot(appPath: string): string | null {
  const candidates = [path.resolve(appPath, "../.."), path.resolve(appPath, "../../..")];
  return candidates.find((root) => fs.existsSync(path.join(root, "packages/scripts/src/mod/build.ts"))) ?? null;
}

/**
 * Compile every mod with the repository's build script (`pnpm build`: linscripts to `.lin`, packed
 * into the game's `.wad`), then ask Steam to launch the game. The build's output is returned so
 * the UI can show why it failed.
 */
export async function runGame(appPath: string): Promise<RunGameResult> {
  const root = repositoryRoot(appPath);
  if (root === null) {
    return { ok: false, output: "Cannot find the repository's build script (packages/scripts/src/mod/build.ts)." };
  }

  const build = await run("node", [path.join(root, "packages/scripts/src/mod/build.ts")], root);
  if (build.code !== 0) {
    return { ok: false, output: `${build.output}\nBuild exited with code ${build.code}.` };
  }

  try {
    const steam = spawn("steam", ["-applaunch", DANGANRONPA_APP_ID], { detached: true, stdio: "ignore" });
    steam.unref();
    await new Promise<void>((resolve, reject) => {
      steam.once("spawn", () => resolve());
      steam.once("error", reject);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, output: `${build.output}\nBuild succeeded but Steam could not be started: ${message}` };
  }

  return { ok: true, output: `${build.output}\nLaunching Danganronpa (Steam app ${DANGANRONPA_APP_ID})…` };
}

function run(command: string, args: string[], cwd: string): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    let output = "";
    const child = spawn(command, args, { cwd, env: process.env });
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("error", (error) => resolve({ code: -1, output: `${output}\n${error.message}` }));
    child.on("close", (code) => resolve({ code: code ?? -1, output }));
  });
}
