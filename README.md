# danganronpa tooling

## Credit
 - The original source for the pak-archiver, wad-archiver and lin-compiler was cloned from https://github.com/vn-tools/danganronpa-tools. I have since converted the python scripts to nodejs. Why did I do that?
 - Many opcodes and discoveries were also manually translated from this fork of the above https://github.com/morgana-x/danganronpa-lin-compiler-v2/tree/master
 - And, a huge wealth of information lies in this attempted modding framework, it has been very helpful https://github.com/SpiralFramework/Spiral

## Requirements
 - `.NET 8.0 SDK` https://dotnet.microsoft.com/en-us/download/dotnet/8.0
 - `Node.js` (I used Node 22) https://nodejs.org/en/download
 - `ffmpeg` (optional, for audio preview in vscode) https://ffmpeg.org/download.html (This doesn't seem to work on Windows)
 - `Danganronpa Trigger Happy Havoc` on Steam. Other versions currently unsupported.

## What is this?
 - This is a danganronpa modding framework that I've frankenstiened into a **VSCode extension** that lives inside a pnpm monorepo (primarily useful tools are the /vscode-extension and /scripts)
 - At this stage, this tool is mostly helpful to learn and understand how the game works rather than create mods.
 - At some point this turned into a vibe coding experiment, so parts of the code are starting to resemble spaghetti.

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

## Linux Users

I used Proton version 10 to test most of these changes.

I'm not certain if it does anything, but you can run `pnpm run clear-proton` to clear the game's proton files.

## Volume Warning

Try not to run *all* of the tests in the linscript exploration folder (or even within a script file). If you do, you can say goodbye to your ears.