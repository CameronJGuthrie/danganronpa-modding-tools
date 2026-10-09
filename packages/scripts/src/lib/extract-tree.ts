/**
 * Turning an extracted WAD into something a person can browse: every `.pak` unpacked into a
 * folder of the same name (nested archives included) and every `.lin` decompiled to a sibling
 * `.linscript`, the originals removed once converted.
 */

import { readdir, rm, unlink } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { type BatchFailure, decompileDirectory } from "lin-compiler";
import { extractPak } from "../formats/pak-archiver.ts";

async function walk(directory: string, visit: (path: string, name: string) => Promise<void>): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, visit);
    } else if (entry.isFile()) {
      await visit(fullPath, entry.name);
    }
  }
}

/**
 * Unpack every `.pak` under `directory` into a folder of the same name and remove the archive,
 * recursing into archives found inside archives. `onPak` is called with each top-level archive
 * before it is unpacked. Returns how many archives were unpacked.
 */
export async function extractPaksUnder(directory: string, onPak?: (pakPath: string) => void): Promise<number> {
  let count = 0;
  const paks: string[] = [];
  await walk(directory, async (path, name) => {
    if (name.endsWith(".pak")) {
      paks.push(path);
    }
  });
  for (const pakPath of paks) {
    onPak?.(pakPath);
    await extractPak(pakPath, pakPath.replace(/\.pak$/, ""), true, 0);
    count++;
  }
  // The pak extractor keeps nested archives next to their folders (and renames entries it
  // recognises as archives to `.pak`); remove every archive that has been unpacked
  await walk(directory, async (path, name) => {
    if (name.endsWith(".pak")) {
      const folder = path.replace(/\.pak$/, "");
      const entries = await readdir(folder).catch(() => null);
      if (entries !== null) {
        await unlink(path);
      }
    }
  });
  return count;
}

export interface DecompileTreeResult {
  /** Decompiled `.linscript` paths. */
  succeeded: string[];
  failed: BatchFailure[];
}

/**
 * Decompile every `.lin` under `directory` to a sibling `.linscript`, removing each `.lin` that
 * converted and keeping the ones that did not. `onDirectory` is called with each directory
 * holding `.lin` files before it is converted.
 */
export async function decompileLinsUnder(
  directory: string,
  onDirectory?: (directory: string) => void,
): Promise<DecompileTreeResult> {
  const directories = new Set<string>();
  await walk(directory, async (path, name) => {
    if (name.endsWith(".lin")) {
      directories.add(dirname(path));
    }
  });

  const result: DecompileTreeResult = { succeeded: [], failed: [] };
  for (const linDir of [...directories].sort()) {
    onDirectory?.(linDir);
    const batch = await decompileDirectory(linDir);
    for (const lin of batch.succeeded) {
      await rm(lin);
      result.succeeded.push(join(linDir, `${basename(lin, ".lin")}.linscript`));
    }
    result.failed.push(...batch.failed);
  }
  return result;
}
