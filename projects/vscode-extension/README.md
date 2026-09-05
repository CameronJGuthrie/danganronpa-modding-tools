# Danganronpa VSCode Extension

This extension provides syntax highlighting and file watching capabilities for Danganronpa modding projects.

## Marker File Configuration

The extension uses a marker file to determine the root directory for file watching operations. This allows you to open VSCode at any level of your project without having all folders in scope.

### Setup

1. Create an empty file named `.danganronpa-working-root` in the directory where you want to work on extracted files:

```bash
touch /path/to/your/working/directory/.danganronpa-working-root
```

2. Open VSCode at any level at or above this directory. The extension will:
   - Search recursively downward from your workspace folders
   - Find the `.danganronpa-working-root` marker file
   - Use that directory as the root for modding

### LINSCRIPT Features

- **Syntax highlighting** works everywhere regardless of the marker file
- **Navigate to labels** quickly by `ctrl+click`ing on the Label opcode.
- **Way too much text decoration** on the right of each opcode at a fixed offset.
- **Interactive Sound/Music/Voice player** to the left of the line number column there is a green play button for Sound, Voice, Music opcodes. Click it to hear the sound in the game.
