import { Script } from "./script.js";
import { readCompiledFile, readSource } from "./scriptRead.js";

/** Load a script from disk, either from compiled `.lin` bytes or from `.linscript` source. */
export async function loadScript(filename: string, compiled = true): Promise<Script> {
  const script = new Script();
  if (compiled) {
    await readCompiledFile(script, filename);
  } else {
    await readSource(script, filename);
  }
  return script;
}
