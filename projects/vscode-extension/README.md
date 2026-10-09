# Danganronpa VSCode Extension

This extension provides syntax highlighting and file watching capabilities for Danganronpa modding projects.

## Workbench Folder Configuration

The extension needs to know where the workbench is: the folder holding the extracted game data
(`base_files/`, `exploration/`, `mod/<name>/`). Script selection, go-to-definition and the
audio players all resolve paths under it.

It is read from the `lindecompilerhelper.workbenchRoot` setting. The default, `workbench`, is
resolved against the first workspace folder, so opening this repository needs no configuration.
To work on a workbench elsewhere, run **LinScript: Choose Workbench Folder** from the command
palette (or set the setting by hand, with an absolute path or one relative to the workspace folder).
The choice is stored in the workspace settings when a workspace is open, otherwise in the user settings.

### LINSCRIPT Features

- **Syntax highlighting** works everywhere regardless of the workbench setting
- **Navigate to labels** quickly by `ctrl+click`ing on a Label instruction.
- **Way too much text decoration** on the right of each instruction at a fixed offset.
- **Interactive Sound/Music/Voice player** to the left of the line number column there is a green play button for Sound, Voice, Music instructions. Click it to hear the sound in the game.
