# SPFT - Sprite Font Format

Danganronpa-specific sprite font format used for text rendering.

## Magic Number

- **Bytes**: `74 46 70 53` (`tFpS` ASCII)
- **Little-endian interpretation**: `SpFt` (Sprite Font)
- **File extension**: `.spft`

## Header Structure (0x20 bytes)

| Offset | Size | Description |
|--------|------|-------------|
| 0x00 | 4 | Magic `tFpS` |
| 0x04 | 4 | Version (observed: `0x00000004`) |
| 0x08 | 4 | Glyph count |
| 0x0C | 4 | Unknown (offset/size related) |
| 0x10 | 4 | Unknown (offset/size related) |
| 0x14 | 4 | Base character size (e.g., `0x20` = 32 pixels) |
| 0x18 | 4 | Character count in mapping table |
| 0x1C | 4 | Flags (observed: `0x00000001`) |

## Character Mapping Table (offset 0x20)

Starting at offset 0x20, a Unicode-to-glyph-index mapping table:

- Each entry is 2 bytes (little-endian uint16)
- `0xFFFF` = character not present in font
- Otherwise = glyph index into the texture atlas

The table is indexed by character code. For ASCII fonts, entries for printable characters (0x20+) begin around offset 0x60 in the file.

## Glyph Data

After the mapping table, the actual glyph bitmap/texture data follows. The exact format of glyph data is not yet fully documented.

## Example Files

Found in: `dr1_data_us.wad/Dr1/data/us/font/font/`

- `0001` - Main font (323 glyphs, includes full ASCII + extended characters)
- `0003` - Alternative font (179 glyphs, reduced character set)

## Notes

- This is a proprietary format specific to Spike Chunsoft's Danganronpa engine
- Similar in concept to BMFont or other sprite-sheet font formats
- The magic number `SPFT`/`tFpS` does not conflict with any known standard file format
