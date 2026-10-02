# Modding operation entry points

**Decision (October 2026):** the shipped applications are the VS Code extension and the GUI, and
neither can assume a repository checkout. A command-line tool is therefore the wrong seam between
them and the logic, so `projects/cli` was removed. `lin-compiler` gained `compileFile`,
`decompileFile`, `compileDirectory` and `decompileDirectory`, the scripts package imports them
instead of shelling out, and the next step is for the extension and GUI to bundle the scripts
package's operations as functions rather than spawning `pnpm`. Each app now has its own workbench
setting (`lindecompilerhelper.workbenchRoot`; the GUI's `settings.json` in its user-data folder)
in place of the old `.danganronpa-working-root` marker file.

The inventory below records the state that led to that decision: every place that invoked a
modding operation, grouped by caller, and the scripts nothing calls.

## Entry points by caller

### Root pnpm scripts (`package.json`)

| pnpm command | Script | Shells out to |
|---|---|---|
| `setup` | `setup/zip-game-files.ts`, then `unpack`, then `reset` | |
| `unpack` | `setup/unpack-base-files.ts` | external tool via `exec` (line 52) |
| `reset` | `setup/extract-linscript.ts` | `wad-archiver.ts extract`, then `cli.ts -s -d <dir>` |
| `extract-recursive`, `extract-recursive:all` | `setup/extract-recursive.ts` | imports `extractPak`; hardcodes `node projects/cli/src/cli.ts -d` (line 245, cwd-dependent) |
| `validate-paks` | `setup/validate-paks.ts` | |
| `select` | `mod/select.ts` | `cli.ts -d <tmp.lin> <out>`, then `rm`, `chmod`, `code <file>` |
| `verify` | `mod/verify.ts` | `cli.ts -d <tmp.lin> <out>`, then `rm`, `code <file>` |
| `build` | `mod/build.ts` | `cli.ts -s <stagingDir>`, `find … mv`, `wad-archiver.ts create` |
| `game` | `game/launch-game.ts` | `x-terminal-emulator -e steam -applaunch` |
| `start` | `build` then `game` | |
| `investigate` | `explore/investigate.ts` | |
| `copy` | `explore/generator.ts` | clipboard |
| `gui`, `ext`, `lint*`, `test:all`, `knip` | tooling, not modding operations | |

### Format scripts with their own CLI tails

Invoked only by file path, never from a pnpm script:

- `formats/wad-archiver.ts` — used by `reset` and `build`
- `formats/pak-archiver.ts` — CLI tail unused; `extractPak` imported once by `extract-recursive`
- `formats/spike-chunsoft-decompress.ts` — no callers
- `formats/gxt-to-png.ts` — no callers

### VS Code extension (`projects/vscode-extension/src/extension.ts`)

Two operations, both run by opening a new terminal and polling the filesystem for the output
file (100 ms interval, 10 s timeout, no exit code or stderr available):

- "Select for Modding" sends `pnpm select <file>` (line 60)
- "Verify File" sends `pnpm verify <file>` (line 102)

The other two commands only toggle decorations. The extension imports `linscript-definitions`
but neither `lin-compiler` nor the scripts package.

`select.ts` and `verify.ts` also run `code <file>` themselves, so the extension's polling and
the script's own editor-open overlap. A CLI `select`/`verify` should return the output path and
leave opening the file to the caller.

### GUI (`projects/gui/src/main/`)

One IPC handler touches the pipeline:

- `run-game` (`game.ts`) spawns `node packages/scripts/src/mod/build.ts` with captured output,
  then spawns `steam -applaunch`. It locates the repository by probing for that script path
  (line 17).

Every other handler (`load-script`, `save-script`, `list-modified-scripts`, `search-scripts`,
asset loaders) is plain file IO in-process. The GUI never compiles or decompiles. It duplicates
the flat-name rule from `packages/scripts/src/lib/mod-scripts.ts` in `scripts.ts`.

## Operations the apps need as functions

- `compile` / `decompile` — exists today as the default and `-d`
- `select <lin>` — prints the created `.linscript` path
- `verify <lin>` — prints the created `.linscript` path
- `build [wad]` — the GUI's `run-game` needs captured output and an exit code
- `game` — launch Steam; `start` becomes `build` + `game`
- `reset`, `unpack`, `setup`, `extract-recursive`, `validate-paks` — setup operations
- `wad extract|create`, `pak extract|…` — currently reachable only by file path
- `investigate <opcode> [args]` — research tooling

Internal shell-outs from one script to another (`build` calling the compiler and wad-archiver via
`node <path>`) should become direct function imports once everything sits behind one entry
point. That also removes the hardcoded relative path in `extract-recursive.ts`.

## Unused or questionable scripts

- `formats/spike-chunsoft-decompress.ts`, `formats/gxt-to-png.ts` — no callers; kept alive only
  by the `knip.json` entry glob for the scripts package
- `formats/pak-archiver.ts` — CLI tail unused; dead `_execAsync` at line 12
- `explore/generator.ts` (`pnpm copy`) — scratch file of commented-out loops; looks one-off
- `setup/validate-paks.ts` — has a pnpm script, nothing else references it
- `projects/cli` `build`, `watch`, `bin`, `files: ["out"]` — nothing runs the compiled output
