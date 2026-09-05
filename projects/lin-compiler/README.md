# lin-compiler

TypeScript CLI and library for compiling/decompiling Danganronpa script files between the
binary `.lin` format and the human-readable `.linscript` format.

## Build and test

```bash
pnpm --filter lin-compiler run typecheck   # or, from the repo root: pnpm compile
pnpm --filter lin-compiler run test        # unit tests, plus a corpus round-trip when scripts are extracted
```

There is no build output: Node runs the TypeScript sources directly via type stripping, with `src/cli.ts` as the entry point.

The corpus test in `test/corpus.test.ts` decompiles and recompiles every `.lin` under
`workspace/modded/dr1_data_us/Dr1/data/us/script` and checks the regenerated source is
identical. It is skipped when that directory has not been extracted with `pnpm unpack`.

## Usage

```bash
node projects/lin-compiler/src/cli.ts [options] input [output]
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
node projects/lin-compiler/src/cli.ts -d input.lin output.linscript   # decompile
node projects/lin-compiler/src/cli.ts input.linscript output.lin      # compile
node projects/lin-compiler/src/cli.ts -s -d path/to/scripts/          # batch decompile a directory
```

When `input` is a directory, every matching file in it is processed in place: `*.lin` →
`*.linscript` when decompiling, `*.linscript` → `*.lin` when compiling. An `output` path is
not accepted in that mode.

## Library

The package also exports its internals for use from other scripts. Readers return a `Script`,
writers take one, and nothing depends on process-wide state:

```ts
import { readCompiledFile, readSource, writeCompiledBytes, writeSourceText } from "lin-compiler";

const script = await readCompiledFile("input.lin");
const source = writeSourceText(script, { indentSpaces: 4, hexOpcodes: false });
const bytes = writeCompiledBytes(readSource(source));
```

A `Script` is `{ entries: ScriptEntry[] }`, where each entry is `{ opcode, args, text? }` with
`args` holding the raw argument bytes and `text` set only on Text entries. Malformed source
throws `SourceError` (with a 1-based `line`); malformed binaries throw `BinaryError`.

## Layout

| Path | Contents |
| --- | --- |
| `src/cli.ts` | Argument parsing, single-file and batch drivers, all console output |
| `src/script.ts` | `Script` / `ScriptEntry` model and `ScriptType` |
| `src/io/lin-reader.ts` | Parsing of compiled `.lin` bytes |
| `src/io/lin-writer.ts` | `.lin` serialisation |
| `src/io/linscript-reader.ts` | Parsing of `.linscript` source |
| `src/io/linscript-writer.ts` | `.linscript` emission (indentation, AutoText collapsing) |
| `src/parameter.ts` | Argument encodings (`Byte`, `UInt16LE`, `UInt16BE`) and decimal parsing |
| `src/errors.ts` | `SourceError` and `BinaryError` |
| `src/opcodes/` | Opcode table and the per-opcode behaviours |
| `test/` | `node:test` suites |

To teach the compiler a new opcode, add an entry to `opcodeList` in
`src/opcodes/opcodeDictionary.ts`. Opcodes needing custom argument formatting or source
expansion subclass `BaseOpcode` and override `formatArgs` (decompile) and `parseSource` or
`parseArgs` (compile); see `TextOpcode`, `AutoTextOpcode`, `EvaluateOpcode`. AutoText sugar is
owned entirely by `src/opcodes/autoTextOpcode.ts`, which handles both expansion and collapsing.

Unknown opcodes decompile to `0xNN(bytes...)` and compile back from that form verbatim.

## Credit
 - The original source for the lin-compiler was cloned from https://github.com/vn-tools/danganronpa-tools.
   It was a C# / .NET project until it was ported to TypeScript; the port was verified to produce
   byte-identical output in both directions across the full 1,869-file script corpus.
