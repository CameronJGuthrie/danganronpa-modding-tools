# Danganronpa Modding Tools

## Repository layout
Libraries and scripts live under `packages/`, applications under `projects/`:
- `packages/definitions` - the `linscript-definitions` package: shared enums such as `LinscriptInstructionName`, `Character`, `Chapter`, plus lookup tables under `src/data/` (sound, music and movie names, voice line transcripts, character, sprite, present, flag, variable, UI, background, skill, text-style and truth-bullet names) used by both the extension and the GUI. It has no build step: its `exports` point at `src/index.ts`, so every consumer imports the TypeScript source. Enums are plain objects made with `defineEnum` in `src/enum.ts` (same shape as a numeric enum, including the value-to-name reverse mapping) so the package stays erasable for Node's type stripping and `erasableSyntaxOnly`; use `typeof Character.Makoto` when a member is needed as a type
- `packages/lin-compiler` - TypeScript `.lin` <-> `.linscript` (de)compiler library. There is no command-line tool: the scripts package, the GUI and the extension call the library directly
- `packages/scripts` - TypeScript automation scripts, run directly via Node type stripping (root `pnpm run ...` commands)
- `projects/vscode-extension` - the `lindecompilerhelper` VSCode extension. `tsc` only typechecks it; esbuild bundles `src/extension.ts`, the tests and the grammar builder into `out/`, which is how the extension host loads the definitions source
- `projects/gui` - Electron asset browser (standalone; not a workspace package, has its own lockfile)

`docs/file-formats/` holds reverse-engineering notes; `workbench/` holds generated working files.
All but `projects/gui` are pnpm workspace packages (see `pnpm-workspace.yaml`).

## Opcode Investigation:
Use `pnpm run investigate` to analyze opcode usage patterns across the `.linscript` files in `workbench/exploration`:

```bash
# Analyze all uses of an opcode (default: sorted by frequency)
# The filter is required and must have one entry per argument of the opcode
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
1. Extract `.wad` archives with `packages/scripts/src/formats/wad-archiver.ts` (or `pnpm run unpack` for both base WADs) to get `.pak` files or direct `.lin` files
2. For PAK files: extract with `packages/scripts/src/formats/pak-archiver.ts` (`pnpm run extract-recursive` walks nested PAKs)

## lin-compiler
`.linscript` is not a live format. It is still being designed and has no external consumers, so opcode names and argument sugar can change freely; regenerate `workbench/` with `pnpm run reset` after a rename rather than keeping compatibility shims.

TypeScript library for compiling/decompiling Danganronpa script files between binary `.lin` format and human-readable `.linscript` format. Source in `packages/lin-compiler/src/`; consumers import it by its package name (`workspace:*`).

**Status:** Node.js/TypeScript (migrated from C#). No build step — it runs straight from source via Node's type stripping. `pnpm --filter lin-compiler run typecheck` typechecks it.

**Usage:** there is no command-line tool. Single files go through `decompileFile(lin, linscript)` / `compileFile(linscript, lin)` and whole directories through `decompileDirectory(dir)` / `compileDirectory(dir)` (`src/io/batch.ts`), which convert every matching file in place and return the succeeded and failed paths rather than throwing on the first bad file. The `pnpm` scripts (`reset`, `select`, `verify`, `build`, `extract-recursive`) are the terminal entry points. Opcodes are only ever written by name: there is no hex form, so an opcode missing from the table is a decompile error.

**Tests:** `pnpm --filter lin-compiler run test` runs the `node:test` suites in `packages/lin-compiler/test/`. The corpus test round-trips every `.lin` in `workbench/modded/dr1_data_us/Dr1/data/us/script` and is skipped if that directory is missing. Run it after any change to the reader, writer, or opcode table.

Opcode definitions live in `packages/lin-compiler/src/definitions/opcode.definition.ts` — add a row to `opcodes` to teach the compiler a new opcode. Each row has an `ArgumentSpec` (`fixed`, `repeat`, `variadic`, `text`, `type`); all formatting and parsing for these kinds is in `src/opcodes/arguments.ts`, so a new kind is a union member plus a switch case there.

The library API is pure: readers return a `Script`, writers take one plus a `WriteSourceOptions` object; there is no global options state.

**Source sugar.** Several source forms are not binary opcodes.
- **Named parameters:** a layout slot can be `named(Byte, Character)`, backed by an enum from `linscript-definitions`. Known values decompile to their name (`Speaker(Makoto)`), compile accepts the name or the number, and unknown values stay numeric. A slot's table can depend on an earlier slot (`DependentParameter`): the flag offset of `SetFlag`/`IfFlag` uses `flagNamesByFlagGroup` from `linscript-definitions`, so `SetFlag(0, 4, 1)` decompiles to `SetFlag(System, HandbookEnabled, True)`; add a flag name to `data/flag-data.ts` and both the compiler and the extension pick it up. Music ids use the `Music` enum (`packages/definitions/src/music.ts`): track titles as identifiers without the OST numbers, `_2` appended when a second id shares a title (`GoodbyeDespairSchool_2`, `DespairSyndrome_2`), and `Stop` for 255; the display titles stay in `data/music-data.ts`, so a new track needs a row in both.
- **`Text(...)`** (`src/opcodes/textSugar.ts`) stands for the binary text opcode plus its WaitFrame/TextStyle/WaitInput; both expansion and collapsing live there. The text gets an implicit trailing newline, placed before any closing style tags so `<thought>hi</thought>` compiles to `<CLT 4>hi\n<CLT>`, and the decompiler strips it again. A leading `TextStyle` is emitted only when the text opens with a style tag, matching the game. Instructions written after the string, `Text("...", Wait(10), SetUI(Rumble, Hidden))`, are placed after the text's WaitFrames and before the WaitInput; control flow, block openers and the sugar's own opcodes are refused there (`isTrailingEntry`). The decompiler writes the trailing instructions one per line, indented one level under the `Text(` line, and the reader accepts any statement whose parentheses stay open at the end of a line as continuing onto the next lines until they close. The decompiler matches the TextStyle sequence exactly but not the WaitFrame count or the trailing newline: a shipped line with one WaitFrame fewer than its newlines, or no trailing newline at all, still decompiles to `Text`, and recompiling it emits the normal bytes, so those few lines are not byte-identical after a round trip. `RawText(...)` is written only where the sugar cannot express the bytes: mostly menu prompts and option labels with no WaitInput, and lines where a WaitFrame sits after other instructions.
- **Text style tags** (`src/opcodes/textStyles.ts`): the game's `<CLT n>`/`<CLT>` switches decompile to role wrappers such as `<thought>…</thought>` and `<keyword>…</keyword>` (roles and colour aliases live in `packages/definitions/src/text-style.ts`). A close tag returns to the enclosing style, an unclosed wrapper resets nothing, and bytes that wrappers cannot express fall back to flat `<style n>` switches.
- **`Wait(frames)`** (`src/opcodes/wait.ts`) stands for `SetVariable(Wait, =, frames)`.
- **`Time(Night)`** (`src/opcodes/time.ts`) stands for `SetVariable(Time, =, value)` with a `TimeOfDay` name (`Day`, `Night`, `Morning`, `Midnight`, `Unknown`; the enum lives in `linscript-definitions`). Only names are accepted in source; an assignment of a value without a name, or any other arithmetic mode, stays plain `SetVariable`.
- **`Mode(Thinking)` / `Mode(Speaking, Monokuma)` / `Mode(System)`** (`src/opcodes/mode.ts`) stands for the UI toggles that start a character's lines followed by `Speaker(character)`. `Thinking` and `Speaking` are `SetUI(Thinking, Shown|Hidden)` plus `SetUI(Name, Shown)`, character defaulting to Makoto; `System` is `SetUI(Name, Hidden)` plus `Speaker(Blank)`, for sound effects and tutorial prompts that nobody says (`Mode` enum in `linscript-definitions`; `Speaking`/`Thinking` are the Thinking interface's visibility byte, `System` is source-only). Every mode also emits `SetUI(Textbox, Shown)` first. The game writes the toggles at the start of a run of `SetUI` lines that ends in `Speaker`, so the decompiler collapses the nearest Thinking, Name and `Textbox Shown` toggles in the `SetUI` run directly before a `Speaker` and writes `Mode(...)` where the `Speaker` was, with the rest of the run left before it. A `Name Hidden` in the run makes it `System` (any Thinking toggle in that run stays plain, and a non-Blank speaker is kept as `Mode(System, Makoto)`); otherwise a Thinking toggle makes it `Speaking`/`Thinking` and absorbs a `Name Shown` if there is one. Every shipped Thinking toggle runs with the name plate on, so recompiling always emits `Name Shown`, which adds an idempotent opcode to the roughly 5000 shipped lines that omit it. `Textbox Shown` is implied the same way: the game opens the textbox for a `Text` regardless, so recompiling always emits it and about 4000 shipped Modes that lack it gain a harmless opcode. The run's bytes are reordered or extended but not changed in effect. `Textbox Hidden`, and a `Textbox Shown` before anything other than a sugared `Speaker`, stay plain. A toggle with no `Speaker` after its run, and a `Speaker` with neither a Thinking toggle nor `Name Hidden` before it, stay plain. A plain `SetUI(Name, Hidden)` before a `Goto` (free-time and menu setup) is not sugared, so the name stays hidden across that section until something shows it again.
- **Branches** (`src/opcodes/branch.ts`): every condition (`If`, `IfFlag`, `IfRelationship`, `IfFreeTimeEvent`) is written with its jump as a trailing argument, `IfRelationship(Sayaka, >, 0, Goto(HatedGift))`, which the decompiler places on its own line indented under the condition, and which compiles to the condition, `Then` and `Goto` opcodes. The form is mandatory because the game's scripts contain no other shape (5853 of 5853 conditions are followed by exactly `Then` + `Goto`): `Then` is a hidden opcode that source cannot write, a condition without `Goto(...)` is a source error, and a binary condition not followed by `Then` + `Goto`, or a stray `Then`, is a decompile error rather than a raw fallback. The label is a `Label`-scope argument, so `LabelName` names apply.
- **`Meta()` block** (`src/opcodes/meta.ts`): source-only, per-script annotations at the bottom of the file, e.g. `Object(20, Monitor)` names an object id so the body reads `OnObject(Monitor)` / `ObjectState(Monitor, …)`, and `Option(3, Leave)` names a menu option id for `SetOption(Leave)` / `Option(Leave, "Leave")`, and `Character(1, Taka)` names a placed-character slot so `OnCharacter(1)` reads `OnCharacter(Taka)`. `LabelName(5, HatedGift)` names a jump label so `Label(5)` / `Goto(5)` read `Label(HatedGift)` / `Goto(HatedGift)`. `SceneFlag(1, RoomIntroSeen)` names a slot of the `SceneFlags` flag group (group 15), so `SetFlag(SceneFlags, 1, True)` / `IfFlag(SceneFlags, 1, …)` read `SetFlag(SceneFlags, RoomIntroSeen, True)`; the group's fixed `Reset` name still applies. `SceneFlags` is a bank of per-scene scratch booleans, not a per-character record: every scene entry script resets it, slots are handed out from 0 as a scene needs them (slot 1 means "room intro seen" in chapter 1 scene 9 and something else elsewhere), and usage falls off with the slot number, so its offsets are never written as character names. Character slot ids are the first argument of the setup `Sprite(...)` lines (a slot is placed and interactable when that line's fourth argument is `Set`, the `SpriteTransition` enum's zero), not the `Character` enum, so they are declared per script. Only option ids 18 and 19 are named in every script without declaring them, `Exit_1` and `Exit_2` (`DEFAULT_OPTION_NAMES`); a declared entry may override a default. The choices are not defaults because id 1 is not always "Yes": scripts whose labels are literally "Yes"/"No" declare `Option(1, Yes)` / `Option(2, No)` in their own `Meta()` block. It has no binary form: compiling drops it and decompiling a `.lin` produces none, so names live only in the authored `.linscript` (and in `Script.meta` in the API). Object, character, option and label ids are `scope: "Object"` / `scope: "Character"` / `scope: "Option"` / `scope: "Label"` parameters whose name table comes from the script rather than an enum (`ScopeTables` in `parameter.definition.ts`); the flag offset stays a `DependentParameter` on the group and reaches the `SceneFlag` scope through its `scopeBy` entry for group 15, merged over the group's fixed names. Names must be identifiers, unique per file and kind; ids are 0–254 except label ids, which are 16-bit (0–65535). The GUI's Objects panel (read-only) and the VS Code decorations both read this block.
- **`Option(n, "label")`** (`src/opcodes/option.ts`) stands for `SetOption(n)` followed by the choice's label as `RawText("label\n")` and one `WaitFrame`; the newline is implicit as in `Text`. Only a `SetOption` whose label immediately follows collapses, so handler registrations (`SetOption(18)`/`SetOption(19)`), the closing `SetOption(255)` and options with anything between them and their label stay plain. The option's body is indented under the `Option(...)` line.
- **`MapCharacter(room, character, True|False)`, `MapIcons(True|False)`, `MapClearCharacterStatus()`, `MapClearPositions()`, `MapClearAll()`** (`src/opcodes/map.ts`) stand for the binary `MapState(room, character, mode)` opcode (0x01, formerly called `LoadSprite`), which keeps the roster of who is in which room for the Monopad map and the room scripts. The room is the room script's number (`MapCharacter(136, Aoi, True)` puts Aoi in `e01_008_136`), the character is a `MapCharacter` name from `linscript-definitions` (students plus the unidentified `MapCharacter_20/29/30`; unknown ids stay numeric), and modes 0/1 are absent/present. Modes 252–255 are resets written with room 255 and the character byte as a payload: 252 clears per-character status, 253 toggles the map icons with the payload as its on/off value, 254 clears positions and 255 clears everything. All 2339 shipped uses fit these five forms, so `MapState` is a `hidden` row and other bytes are a decompile error. The meanings of 252 and 253 are inferred from where the scripts write them and have not been tested in game.
- **`GivePresent(Name)` / `ReceivePresent(Name)`** (`src/opcodes/present.ts`) stand for the binary `Present(id, -=|+=, 1)` opcode. `Present` is a `hidden` opcode row that source cannot name directly, ids must be `Present` enum names, and any other mode or quantity is a decompile error rather than a raw fallback.

## gui
Electron desktop app for browsing Danganronpa assets, read-only. Features a character sprite viewer, a Script Viewer (control-flow tree, all-lines view, text search, object names from the `Meta()` block; a script's mod copy is shown when one exists), TGA image support and a Run Game button that builds and launches the game.

The Script Viewer's right pane has two sub-tabs, Script (the lines) and Flow (a flowchart). `src/script/controlFlow.ts` parses the source into the tree the left pane shows; `src/script/flowGraph.ts` turns that tree into boxes (runs of instructions, split at labels), diamonds (conditions, with "yes" to the `Goto` target and "no" to the fallthrough), labelled fan-outs for menus and handler groups, and terminals (`StopScript`, `Return`, `LoadScript`), dropping code nothing flows into; `src/script/flowLayout.ts` sizes the shapes and lays them out with `@dagrejs/dagre`; `FlowDiagram.tsx` draws them as SVG with drag-to-pan and wheel zoom. Clicking a shape selects it, double-click (or "Show in script") opens its line in the Script pane, and picking a node in the tree outlines and centres its shapes.

## pak-archiver
Utility for extracting, creating, and modifying PAK archive files. Handles nested archives and detects GMO/TGA file types.

**Status:** Migrated to TypeScript (packages/scripts/src/formats/pak-archiver.ts).

## scripts
TypeScript automation scripts for common modding operations, kept under `packages/scripts/src/` in subdirectories by purpose:
- `lib/` - shared helpers with no side effects on import (`errors.ts`, `steam-paths.ts`, `paths.ts` for repo/workbench/CLI paths, `mod-scripts.ts` for the mod script layout rules)
- `formats/` - binary format libraries with a CLI tail (`wad-archiver`, `pak-archiver`, `spike-chunsoft-decompress`, `gxt-to-png`)
- `setup/` - getting game data into the workbench (`zip-game-files`, `unpack-base-files`, `extract-linscript`, `extract-recursive`, `validate-paks`)
- `mod/` - the edit/build/test loop (`select`, `verify`, `build`, `gift-dialogue`)
  - `gift-dialogue <Character>` regenerates the present handlers of that character's gift script (`e08_CCC_000`, which must already be in `workbench/mod`) from an authored table in `mod/gift-dialogue/<character>.ts` (Sayaka is the first). A table entry per present gives its reaction (`Okay`/`Liked`/`Loved`/`Disliked`/`Hated`, which picks the `Goto` and the 122/123 gift sound), an optional brief written back as comments, and lines built with `say(sprite, text, voice?)`, `makoto(text, voice?)`, `think(text)` and `raw(opcode)`. Sprite names come from `sprites[character]` and voices are Chapter_99 ids or transcripts from `linscript-definitions`; text is wrapped at 56 characters and refused past two lines. The first run also strips the shipped dialogue from the result handlers so only Makoto's closing thought remains; reruns only touch the handlers.
  - `workbench/mod/<wad>/Dr1/data/us/script/` holds authored `.linscript` files, either flat (`e01_005_103.linscript`) or organised as `chapter_01/scene_005/103_MakotosRoom.linscript`. Only the leading numbers name the script; anything after them (separated by a non-digit) is a label, on the chapter and scene directories too (`chapter_08_despair/scene_007_sayaka/001.linscript`). New files are always created flat; labelled directories are reused, never created. The rule lives in `lib/mod-scripts.ts` (`flatScriptName`), and the GUI mirrors it in `projects/gui/src/main/scripts.ts` to find a script's mod copy.
  - `build` copies the flattened scripts to `workbench/build/<wad>/…/script/`, compiles there, moves the `.lin` output into `workbench/modded/` and packs the WAD, so no `.lin` lands in `workbench/mod/`. Two files flattening to the same name, or a file fitting neither layout, fail the build.
  - `select` refuses to overwrite an existing authored file for the same script (flat or organised): the CLI errors naming the file, the extension's "Select for Modding" opens it instead.
- `game/` - Steam control (`launch-game`)
- `explore/` - opcode research (`investigate`, `generator`)

Scripts resolve repository paths through `lib/paths.ts` rather than counting `..` segments, so they can move between subdirectories freely.

They are run directly by Node's type stripping - there is no build step, so `node packages/scripts/src/mod/build.ts` just works (requires Node >= 26). Because Node strips types rather than transforming syntax, these files must stay erasable: no `enum`, no `namespace`, no constructor parameter properties. `tsc` enforces this via `erasableSyntaxOnly`. Local imports name the real `.ts` file (`../lib/steam-paths.ts`), which is what Node resolves at runtime.

Typecheck with `pnpm --filter danganronpa-scripts run typecheck` (emits nothing).

**Node.js scripts:**

## vscode-extension
VSCode extension providing syntax highlighting and language support for `.linscript` files, making it easier to read and edit decompiled Danganronpa scripts.

The workbench is located through the `lindecompilerhelper.workbenchRoot` setting (default `workbench`, relative to the first workspace folder; "LinScript: Choose Workbench Folder" picks another). "Select for Modding" and "Verify File" run in-process: `src/features/scripts.ts` does the file work and `lin-compiler` runs on a `worker_threads` worker (`src/worker/compiler-worker.ts`, bundled by esbuild to `out/compiler-worker.js`, driven by `CompilerClient` in `src/features/compiler.ts`) so compiling never blocks the extension host. The extension depends on `lin-compiler` and `danganronpa-scripts` as workspace packages and esbuild bundles their sources, so the shipped `.vsix` carries them.
