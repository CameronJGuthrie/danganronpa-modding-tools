# danganronpa tooling

## Credit
 - The original source for the pak-archiver, wad-archiver and lin-compiler was cloned from https://github.com/vn-tools/danganronpa-tools. I have since converted the python scripts to nodejs, and the C# lin-compiler to TypeScript. Why did I do that?
 - Many opcodes and discoveries were also manually translated from this fork of the above https://github.com/morgana-x/danganronpa-lin-compiler-v2/tree/master
 - And, a huge wealth of information lies in this attempted modding framework, it has been very helpful https://github.com/SpiralFramework/Spiral

## Requirements
 - `Node.js` 22.18 or newer https://nodejs.org/en/download (the scripts run TypeScript directly via Node's built-in type stripping)
 - `ffmpeg` (optional, for audio preview in vscode) https://ffmpeg.org/download.html (This doesn't seem to work on Windows)
 - `Danganronpa Trigger Happy Havoc` on Steam. Other versions currently unsupported.

## What is this?
 - This is a danganronpa modding framework that I've frankenstiened into a **VSCode extension** that lives inside a pnpm monorepo (primarily useful tools are `projects/vscode-extension` and `projects/scripts`)
 - At this stage, this tool is mostly helpful to learn and understand how the game works rather than create mods.
 - At some point this turned into a vibe coding experiment, so parts of the code are starting to resemble spaghetti.

## Repository layout

Every buildable project lives under `projects/`:

| Path | What it is |
| --- | --- |
| `projects/lin-compiler` | TypeScript (de)compiler for the game's `.lin` scripts |
| `projects/scripts` | TypeScript automation scripts behind the root `pnpm run ...` commands |
| `projects/vscode-extension` | The VSCode extension (`lindecompilerhelper`) |
| `projects/gui` | Electron asset browser (standalone, has its own lockfile) |
| `docs/` | Reverse-engineering notes on the game's file formats |
| `workspace/` | Generated working files - extracted game data, mods, scratch |

The first three are pnpm workspace packages; `projects/gui` is installed and run on its own.

## Setup and Usage

> Note: You could use `npm` or `yarn` instead of `pnpm`

1. Install the project dependencies

    ```bash
    pnpm install
    ```

2. Run the first time setup script (this will take a while and around 3GB of disk space to zip up the game's files, then create the working files)

    ```bash
    pnpm run setup
    ```

3. Install the vscode extension

    ```bash
    pnpm run ext
    ```

4. Restart the Extenion Host (in VSCode) to activate the extension

    ```vscode
    (in vscode)

    CTRL + P
    > Restart Extension Host
    ENTER
    ```

5. Select a file to modify

    ```txt
    (in vscode file explorer)
    Locate a .linscript file
    E.g. at workspace/linscript-exploration/e00_003_001.linscript

    Right Click -> Select For Modding
    ```

    OR
    ```txt
    (in vscode file explorer)
    Locate a .lin file
    E.g. workspace/modded/dr1_data_us/Dr1/data/us/script/e00_003_001.lin

    Right Click -> Select For Modding
    ```

6. After making your changes, build and run the game

    ```bash
    # install modifications and start game
    pnpm run start 

    OR

    # install modifications into the game directory
    pnpm run build 

    # start Danganronpa Steam game
    pnpm run game
    ```

## lin-compiler

`projects/lin-compiler` is the TypeScript (de)compiler that converts between the game's binary `.lin`
scripts and the readable `.linscript` format. `pnpm run setup` builds it for you; to rebuild it
on its own:

```bash
pnpm run compile
```

It can also be driven directly, on a single file or on a whole directory:

```bash
node projects/lin-compiler/src/cli.ts -d input.lin output.linscript   # decompile
node projects/lin-compiler/src/cli.ts input.linscript output.lin      # compile
node projects/lin-compiler/src/cli.ts -s -d path/to/scripts/          # batch decompile a directory
```

See [projects/lin-compiler/README.md](projects/lin-compiler/README.md) for the full option list and for how to add
new opcodes.

## Scripts

`projects/scripts` holds the automation behind the root `pnpm run ...` commands. They are
TypeScript, run directly by Node's type stripping - there is no build step:

```bash
node projects/scripts/src/setup/validate-paks.ts    # same as: pnpm validate-paks
```

Typechecking is separate from running, and emits nothing:

```bash
pnpm --filter danganronpa-scripts run typecheck
```

Node strips types rather than transforming syntax, so these files must stay *erasable*: no
`enum`, no `namespace`, no constructor parameter properties, and local imports name the real
`.ts` file (`./steam-paths.ts`). `tsc` enforces this via `erasableSyntaxOnly`.

## Linux Users

I used Proton version 10 to test most of these changes.

I'm not certain if it does anything, but you can run `pnpm run clear-proton` to clear the game's proton files.
