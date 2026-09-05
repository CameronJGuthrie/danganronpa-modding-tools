# lin-compiler

TypeScript CLI and library for compiling/decompiling Danganronpa script files between the
binary `.lin` format and the human-readable `.linscript` format.

## Build

```bash
pnpm --filter lin-compiler run build   # or, from the repo root: pnpm compile
```

Output lands in `projects/lin-compiler/dist/`, with `dist/cli.js` as the executable entry point.

## Usage

```bash
node projects/lin-compiler/dist/cli.js [options] input [output]
```

| Option | Description |
| --- | --- |
| `-h`, `--help` | Display the usage message |
| `-d`, `--decompile` | Decompile the input (default is compile) |
| `-s`, `--silent` | Suppress all non-error messages |
| `--hex` | Output opcodes as hex codes instead of names (decompile only) |
| `--indent-spaces N` | Indentation spaces per level (default: 2) |

Examples:

```bash
node projects/lin-compiler/dist/cli.js -d input.lin output.linscript   # decompile
node projects/lin-compiler/dist/cli.js input.linscript output.lin      # compile
node projects/lin-compiler/dist/cli.js -s -d path/to/scripts/          # batch decompile a directory
```

When `input` is a directory, every matching file in it is processed in place: `*.lin` →
`*.linscript` when decompiling, `*.linscript` → `*.lin` when compiling. An `output` path is
not accepted in that mode.

## Library

The package also exports its internals for use from other scripts:

```ts
import { loadScript, writeCompiledBytes, writeSourceText } from "lin-compiler";

const script = await loadScript("input.lin", true);
const source = writeSourceText(script, 2);
```

## Layout

| Path | Contents |
| --- | --- |
| `src/cli.ts` | Argument parsing, single-file and batch drivers |
| `src/script.ts` | `Script` / `ScriptEntry` model and `ScriptType` |
| `src/scriptRead.ts` | Binary `.lin` and `.linscript` source parsing |
| `src/scriptWrite.ts` | `.linscript` emission (incl. AutoText sugar) and `.lin` serialisation |
| `src/parameter.ts` | Argument encodings (`Byte`, `UInt16LE`, `UInt16BE`) |
| `src/opcodes/` | Opcode table and the per-opcode behaviours |

To teach the compiler a new opcode, add an entry to `opcodeList` in
`src/opcodes/opcodeDictionary.ts`. Opcodes needing custom argument formatting or source
expansion subclass `BaseOpcode` (see `TextOpcode`, `AutoTextOpcode`, `EvaluateOpcode`).

## Credit
 - The original source for the lin-compiler was cloned from https://github.com/vn-tools/danganronpa-tools.
   It was a C# / .NET project until it was ported to TypeScript; the port was verified to produce
   byte-identical output in both directions across the full 1,869-file script corpus.
