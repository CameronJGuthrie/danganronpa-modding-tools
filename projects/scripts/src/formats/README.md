# formats

Binary format libraries for Danganronpa game data. Each file exports reader/writer functions and also runs as a CLI when invoked directly with `node`.

| Script | Format | Purpose |
|---|---|---|
| `wad-archiver.ts` | WAD | List, extract, and create the top-level `.wad` archives shipped with the game. |
| `pak-archiver.ts` | PAK | List, extract, create, and edit the nested `.pak` containers found inside WADs. Detects GMO, TGA, LIN, GXT, SPFT, and LLFS entries. |
| `spike-chunsoft-decompress.ts` | ShadeLz | Decompress Spike Chunsoft compressed files (magic `FC AA 55 A7`), mostly GXT textures. |
| `gxt-to-png.ts` | GXT | Convert PS Vita GXT textures to PNG. |

## Formats at a glance

- **WAD**: the outer archive. Holds a directory tree of files, including PAKs and LINs.
- **PAK**: an index of offset/size entries with no filenames. Frequently nested.
- **LIN**: the compiled script format. Handled by `projects/lin-compiler`, not by this directory.
- **LINSCRIPT**: the human-readable source form of LIN produced and consumed by `projects/lin-compiler`.
- **GXT**: PS Vita texture, often wrapped in Spike Chunsoft compression.

## Full documentation

Reverse-engineering notes live in [`docs/file-formats/`](../../../../docs/file-formats/) at the project root:

- [`lin.md`](../../../../docs/file-formats/lin.md) - LIN script format and opcodes
- [`gxt.md`](../../../../docs/file-formats/gxt.md) - GXT textures and Spike Chunsoft compression
- [`llfs.md`](../../../../docs/file-formats/llfs.md) - LLFS animation format
- [`sprite-font.md`](../../../../docs/file-formats/sprite-font.md) - SPFT sprite font format

WAD and PAK do not yet have a dedicated document; the archivers in this directory are the reference implementation.
