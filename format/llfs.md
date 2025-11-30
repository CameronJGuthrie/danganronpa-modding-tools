# LLFS - Animation Format

Danganronpa-specific animation format used for UI animations and effects.

## Magic Number

- **Bytes**: `4C 4C 46 53` (`LLFS` ASCII)
- **File extension**: `.llfs`

## Header Structure (0x20 bytes)

| Offset | Size | Description |
|--------|------|-------------|
| 0x00 | 4 | Magic `LLFS` |
| 0x04 | 4 | Version (observed: 3) |
| 0x08 | 4 | Unknown |
| 0x0C | 4 | Unknown |
| 0x10 | 4 | Unknown |
| 0x14 | 4 | Data offset or first section size |
| 0x18 | 4 | Entry/section count? |
| 0x1C | 4 | Unknown (often 0) |

## Animation Labels

The format contains null-terminated ASCII strings for animation states/labels:

- `fl_stop` - Stop/idle state
- `fl_in` - Fade/fly in animation
- `fl_out` - Fade/fly out animation
- `fl_wait_2`, `fl_wait_4` - Wait states with timing variants

The `fl_` prefix likely stands for "flash" or "frame label".

## Data Structure

After the header, the file contains animation data including:
- Frame/keyframe definitions
- Position/transformation data (observed signed 16-bit values like `0xFFF6` = -10)
- Color data (observed `0x80808080` patterns, likely RGBA)
- Timing information

## Example Files

Found in: `dr1_data_us.wad/Dr1/data/us/bin/bin_art_gallery_l/*/0000`

These appear to be UI animation definitions for the art gallery feature.

## Tools

- [Danganronpa Another Tool](https://github.com/Liquid-S/Danganronpa-Another-Tool) - Detects LLFS by magic bytes
- [SPIRAL Framework](https://github.com/SpiralFramework/Spiral) - General Danganronpa modding framework

## Notes

- LLFS is a proprietary format specific to Spike Chunsoft's Danganronpa engine
- The format appears related to flash-like animation systems (hence `fl_` prefixes)
- Also used as a wrapper for LIN script files in some contexts (see CLAUDE.md notes on LLFS-wrapped LIN format)
