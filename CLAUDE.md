# Danganronpa Modding Tools

## Repository layout
Libraries and scripts live under `packages/`, applications under `projects/`:
- `packages/definitions` - the `linscript-definitions` package: shared enums such as `LinscriptInstructionName`, `Character`, `Chapter`, plus asset lookup tables under `src/data/` (sound, music and movie names, voice line transcripts) used by both the extension and the GUI. Built to `dist/` (CommonJS) by the root `prepare` script so both Node type-stripping consumers and the VS Code extension host can load it
- `packages/lin-compiler` - TypeScript `.lin` <-> `.linscript` (de)compiler library
- `projects/cli` - the `lin-compiler` command-line tool, a thin wrapper over the library; `pnpm --filter lin-compiler-cli run build` emits JavaScript to `projects/cli/out/`
- `packages/scripts` - TypeScript automation scripts, run directly via Node type stripping (root `pnpm run ...` commands)
- `projects/vscode-extension` - the `lindecompilerhelper` VSCode extension
- `projects/gui` - Electron asset browser (standalone; not a workspace package, has its own lockfile)

`docs/file-formats/` holds reverse-engineering notes; `workbench/` holds generated working files.
All but `projects/gui` are pnpm workspace packages (see `pnpm-workspace.yaml`).

## Exploration Mode
This is when I'm trying to discover what the opcodes do. You'll be helping me to understand patterns in the workbench/linscript-exploration/*.linscript files.
I document my findings in these typescript files at projects/vscode-extension/src/functions/*.ts with the names of the opcodes corresponding to the functions. E.g. Voice -> Voice.ts

**Investigation Script:**
Use `pnpm run investigate` to analyze opcode usage patterns across all linscript files:

```bash
# Analyze all uses of an opcode (default: sorted by frequency)
pnpm run investigate <opcode> [x,x,x]

# Filter by specific argument values (use 'x' for any value)
pnpm run investigate SetFlag [12,x,x]  # Find all SetFlag with first arg = 12
pnpm run investigate SetFlag [x,0,x]   # Find all SetFlag with second arg = 0

# Sort results by value instead of frequency
pnpm run investigate Speaker [x] --sort=value
pnpm run investigate SetFlag [x,x,x] --sort=frequency  # explicit default
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
`.linscript` is not a live format. It is still being designed and has no external consumers, so opcode names and argument sugar can change freely; regenerate `workbench/` with `pnpm run reset` after a rename rather than keeping compatibility shims.

TypeScript library for compiling/decompiling Danganronpa script files between binary `.lin` format and human-readable `.linscript` format. Source in `packages/lin-compiler/src/`; the command-line wrapper lives in `projects/cli/src/cli.ts` and imports the library by its package name.

**Status:** Node.js/TypeScript (migrated from C#). No build step — it runs straight from source via Node's type stripping; the CLI entry point is `projects/cli/src/cli.ts`. `pnpm --filter lin-compiler run typecheck` and `pnpm --filter lin-compiler-cli run typecheck` typecheck them.

**Usage:** `node projects/cli/src/cli.ts -d input.lin output.linscript` (decompile) or `node projects/cli/src/cli.ts input.linscript output.lin` (compile). Pass a directory instead of a file for batch mode. Options: `-s` silent, `--hex` hex opcode names, `--indent-spaces N`. Hex output is read-only: the source reader rejects `0xNN(...)` names, so unknown opcodes and `--hex` files do not compile.

**Tests:** `pnpm --filter lin-compiler run test` runs the `node:test` suites in `packages/lin-compiler/test/`. The corpus test round-trips every `.lin` in `workbench/modded/dr1_data_us/Dr1/data/us/script` and is skipped if that directory is missing. Run it after any change to the reader, writer, or opcode table.

Opcode definitions live in `packages/lin-compiler/src/definitions/opcode.definition.ts` — add a row to `opcodes` to teach the compiler a new opcode. Each row has an `ArgumentSpec` (`fixed`, `repeat`, `variadic`, `text`, `type`); all formatting and parsing for these kinds is in `src/opcodes/arguments.ts`, so a new kind is a union member plus a switch case there.

The library API is pure: readers return a `Script`, writers take one plus a `WriteSourceOptions` object; there is no global options state.

**Source sugar.** Several source forms are not binary opcodes; `--hex` output always shows the raw form.
- **Named parameters:** a layout slot can be `named(Byte, Character)`, backed by an enum from `linscript-definitions`. Known values decompile to their name (`Speaker(Makoto)`), compile accepts the name or the number, and unknown values stay numeric.
- **`Text(...)`** (`src/opcodes/textSugar.ts`) stands for the binary text opcode plus its WaitFrame/TextStyle/WaitInput; both expansion and collapsing live there. The text gets an implicit trailing newline, placed before any closing style tags so `<thought>hi</thought>` compiles to `<CLT 4>hi\n<CLT>`, and the decompiler strips it again. A leading `TextStyle` is emitted only when the text opens with a style tag, matching the game. Instructions written after the string, `Text("...", Wait(10), SetUI(Rumble, Hidden))`, are placed after the text's WaitFrames and before the WaitInput; control flow, block openers and the sugar's own opcodes are refused there (`isTrailingEntry`). The trailing instructions may be written one per line, continuing until the `Text(` parenthesis closes; this is the only multi-line statement in the format. The decompiler matches the group strictly (one WaitFrame per newline, the exact TextStyle sequence) and writes `RawText(...)` only where the sugar cannot express the bytes: mostly menu option labels and other text with no WaitInput, text with no trailing newline, and the few lines whose WaitFrame count differs from their newline count.
- **Text style tags** (`src/opcodes/textStyles.ts`): the game's `<CLT n>`/`<CLT>` switches decompile to role wrappers such as `<thought>…</thought>` and `<keyword>…</keyword>` (roles and colour aliases live in `packages/definitions/src/text-style.ts`). A close tag returns to the enclosing style, an unclosed wrapper resets nothing, and bytes that wrappers cannot express fall back to flat `<style n>` switches.
- **`Wait(frames)`** (`src/opcodes/wait.ts`) stands for `SetVariable(Wait, Assign, frames)`.
- **`Meta()` block** (`src/opcodes/meta.ts`): source-only, per-script annotations at the bottom of the file, e.g. `Object(20, Monitor)` names an object id so the body reads `OnObject(Monitor)` / `ObjectState(Monitor, …)`, and `Option(3, Leave)` names a menu option id for `SetOption(Leave)` / `Option(Leave, "Leave")`. Only option ids 18 and 19 are named in every script without declaring them, `Exit_1` and `Exit_2` (`DEFAULT_OPTION_NAMES`); a declared entry may override a default. The choices are not defaults because id 1 is not always "Yes": scripts whose labels are literally "Yes"/"No" declare `Option(1, Yes)` / `Option(2, No)` in their own `Meta()` block. It has no binary form: compiling drops it and decompiling a `.lin` produces none, so names live only in the authored `.linscript` (and in `Script.meta` in the API). Object and option ids are `scope: "Object"` / `scope: "Option"` parameters whose name table comes from the script rather than an enum (`ScopeTables` in `parameter.definition.ts`). Names must be identifiers, unique per file and kind, ids 0–254. The GUI's Objects panel and the VS Code decorations both read this block.
- **`Option(n, "label")`** (`src/opcodes/option.ts`) stands for `SetOption(n)` followed by the choice's label as `RawText("label\n")` and one `WaitFrame`; the newline is implicit as in `Text`. Only a `SetOption` whose label immediately follows collapses, so handler registrations (`SetOption(18)`/`SetOption(19)`), the closing `SetOption(255)` and options with anything between them and their label stay plain. The option's body is indented under the `Option(...)` line.
- **`GivePresent(Name)` / `ReceivePresent(Name)`** (`src/opcodes/present.ts`) stand for the binary `Present(id, Subtract|Add, 1)` opcode. `Present` is a `hidden` opcode row that source cannot name directly, ids must be `Present` enum names, and any other mode or quantity is a decompile error rather than a raw fallback.

## gui
Electron desktop app for browsing and editing Danganronpa assets. Features character sprite viewer, script viewer, and TGA image support.

## pak-archiver
Utility for extracting, creating, and modifying PAK archive files. Handles nested archives and detects GMO/TGA file types.

**Status:** Migrated to TypeScript (packages/scripts/src/formats/pak-archiver.ts).

## scripts
TypeScript automation scripts for common modding operations, kept under `packages/scripts/src/` in subdirectories by purpose:
- `lib/` - shared helpers with no side effects on import (`errors.ts`, `steam-paths.ts`, `paths.ts` for repo/workbench/CLI paths)
- `formats/` - binary format libraries with a CLI tail (`wad-archiver`, `pak-archiver`, `spike-chunsoft-decompress`, `gxt-to-png`)
- `setup/` - getting game data into the workbench (`zip-game-files`, `unpack-base-files`, `extract-linscript`, `extract-recursive`, `validate-paks`)
- `mod/` - the edit/build/test loop (`select`, `verify`, `build`)
- `game/` - Steam and Proton control (`launch-game`, `clear-proton`)
- `explore/` - opcode research (`investigate`, `generator`)

Scripts resolve repository paths through `lib/paths.ts` rather than counting `..` segments, so they can move between subdirectories freely.

They are run directly by Node's type stripping - there is no build step, so `node packages/scripts/src/mod/build.ts` just works (requires Node >= 22.18). Because Node strips types rather than transforming syntax, these files must stay erasable: no `enum`, no `namespace`, no constructor parameter properties. `tsc` enforces this via `erasableSyntaxOnly`. Local imports name the real `.ts` file (`../lib/steam-paths.ts`), which is what Node resolves at runtime.

Typecheck with `pnpm --filter danganronpa-scripts run typecheck` (emits nothing).

**Node.js scripts:**

## vscode-extension
VSCode extension providing syntax highlighting and language support for `.linscript` files, making it easier to read and edit decompiled Danganronpa scripts.
