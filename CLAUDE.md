# Danganronpa Modding Tools

## Exploration Mode
This is when I'm trying to discover what the opcodes do. You'll be helping me to understand patterns in the workspace/linscript-exploration/*.linscript files.
I document my findings in these typescript files at vscode-extension/src/functions/*.ts with the names of the opcodes corresponding to the functions. E.g. Voice -> Voice.ts

**Investigation Script:**
Use `pnpm run investigate` to analyze opcode usage patterns across all linscript files:

```bash
# Analyze all uses of an opcode (default: sorted by frequency)
pnpm run investigate <opcode> [x,x,x]

# Filter by specific argument values (use 'x' for any value)
pnpm run investigate SetVar8 [12,x,x]  # Find all SetVar8 with first arg = 12
pnpm run investigate SetVar8 [x,0,x]   # Find all SetVar8 with second arg = 0

# Sort results by value instead of frequency
pnpm run investigate Speaker [x] --sort=value
pnpm run investigate SetVar8 [x,x,x] --sort=frequency  # explicit default
```

**Sorting options:**
- `--sort=frequency` (default): Sort by most common values first
- `--sort=value`: Sort by value (numeric/alphabetic order)

The script reports:
- Total occurrences across all files
- Frequency distribution of each argument
- Percentage breakdown to identify common patterns

Use this to identify what flag groups, offsets, or parameter combinations mean by observing their usage context.

## Extraction Pipeline
WAD → LIN → LINSCRIPT
WAD → PAK → (GMO | TGA | PAK | ?)

**Two LIN format types found:**
1. **Raw LIN format** (works with lin-compiler) - Found in `dr1_data_us.wad/Dr1/data/us/script/*.lin`
   - Files start with script type byte: `01 00 00 00` (Textless) or `02 00 00 00` (Text)
   - Can be decompiled directly with lin-compiler

2. **LLFS-wrapped format** (NOT supported by current lin-compiler) - Found in `dr1_data.wad` PAK extractions
   - Files start with LLFS header: `4c 4c 46 53` ("LLFS")
   - 16-byte wrapper before actual LIN data
   - Requires LLFS unwrapper or compiler update

**Extraction steps:**
1. Extract `.wad` archives using `unwad.py` to get `.pak` files or direct `.lin` files
2. For PAK files: Extract using `unpak.py` to get individual files

## lin-compiler
TypeScript CLI tool and library for compiling/decompiling Danganronpa script files between binary `.lin` format and human-readable `.linscript` format. Source in `lin-compiler/src/`.

**Status:** Node.js/TypeScript (migrated from C#). Build with `pnpm compile`; entry point is `lin-compiler/dist/cli.js`.

**Usage:** `node lin-compiler/dist/cli.js -d input.lin output.linscript` (decompile) or `node lin-compiler/dist/cli.js input.linscript output.lin` (compile). Pass a directory instead of a file for batch mode. Options: `-s` silent, `--hex` hex opcode names, `--indent-spaces N`.

Opcode definitions live in `lin-compiler/src/opcodes/opcodeDictionary.ts` — add an entry to `opcodeList` to teach the compiler a new opcode. Opcodes needing custom argument handling subclass `BaseOpcode`.

## gui
Electron desktop app for browsing and editing Danganronpa assets. Features character sprite viewer, script viewer, and TGA image support.

## pak-archiver
Utility for extracting, creating, and modifying PAK archive files. Handles nested archives and detects GMO/TGA file types.

**Status:** Migrated to Node.js (scripts/src/pak-archiver.js).

## scripts
NodeJS automation scripts for common modding operations. Scripts are kept in `scripts/src/*.js`:

**Node.js scripts:**

## vscode-extension
VSCode extension providing syntax highlighting and language support for `.linscript` files, making it easier to read and edit decompiled Danganronpa scripts.
