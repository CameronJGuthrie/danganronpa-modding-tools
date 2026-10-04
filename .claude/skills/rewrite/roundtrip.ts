#!/usr/bin/env node
// Compile a .linscript to .lin and decompile it back, for apply.py's text round-trip check.
// usage: node roundtrip.ts <in.linscript> <out.lin> <back.linscript>
// The skill folder is not a workspace package, so the compiler is imported by path.
import { compileFile, decompileFile } from "../../../packages/lin-compiler/src/index.ts";

const [input, lin, back] = process.argv.slice(2);
if (!input || !lin || !back) {
  console.error("usage: roundtrip.ts <in.linscript> <out.lin> <back.linscript>");
  process.exit(2);
}
await compileFile(input, lin);
await decompileFile(lin, back);
