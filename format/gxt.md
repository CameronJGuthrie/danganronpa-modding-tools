# GXT - PlayStation Vita Texture Format

GXT (GIM TeXture) is a texture format used on PlayStation Vita and in Danganronpa games. In Danganronpa, GXT files appear in two forms: raw GXT and a compressed wrapper format.

## Spike Chunsoft Compression (SpikeDRVita)

Danganronpa PS Vita uses a proprietary compression format called "SpikeDRVita" or "PSVSpikeChun". This wrapper can contain GXT textures or other data.

### Magic Number

- **Bytes**: `FC AA 55 A7`
- **Alternative**: `47 58 33 00` (`GX3\0`) for double-compressed data
- **File extension**: None (detected by magic)

### Header Structure (12 bytes)

| Offset | Size | Description |
|--------|------|-------------|
| 0x00 | 4 | Magic `FC AA 55 A7` |
| 0x04 | 4 | Uncompressed size (little-endian) |
| 0x08 | 4 | Compressed data size (little-endian) |
| 0x0C | ... | Compressed data stream |

### Decompression Algorithm

The algorithm uses a circular buffer of 0x1FFF bytes and processes flag bytes that control different operations. The flag byte's upper bits determine the operation type:

**Flag byte with bit 7 set (`flag & 0x80 == 0x80`)** - LZ match start:
- Length: `((flag >> 5) & 0x3) + 4` (range: 4-7 bytes)
- Displacement: `((flag & 0x1F) << 8) | next_byte` (range: 0-0x1FFF)
- Copies `length` bytes from `buffer_position - displacement`
- Saves displacement for potential reuse

**Flag byte pattern `0x60` (`flag & 0x60 == 0x60`)** - LZ match continue:
- Length: `flag & 0x1F` (range: 0-31 bytes)
- Reuses displacement from prior LZ match operation
- Copies `length` bytes from same previous position

**Flag byte with bit 6 set (`flag & 0x40 == 0x40`)** - RLE fill:
- If `flag & 0x10` is clear: length = `(flag & 0x0F) + 4` (range: 4-19)
- Otherwise: length = `((flag & 0x0F) << 8) | next_byte + 4` (range: 4-4099)
- Reads one value byte and repeats it `length` times

**Flag byte with bits 6-7 clear** - Raw literal bytes:
- If `flag & 0x20` is clear: length = `flag & 0x1F` (range: 0-31)
- Otherwise: length = `((flag & 0x1F) << 8) | next_byte` (range: 0-8191)
- Copies `length` bytes directly from compressed stream

The loop continues until output reaches the uncompressed size.

### Decompression Tool

Use `scripts/src/spike-chunsoft-decompress.js` to decompress files:

```bash
node scripts/src/spike-chunsoft-decompress.js input.gxt output.gxt
```

## Raw GXT Format (PS Vita Standard)

### Magic Number

- **Bytes**: `47 58 54 00` (`GXT\0` ASCII)
- **File extension**: `.gxt`

### Header Structure (0x20 bytes)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0x00 | 4 | char[4] | Magic `GXT\0` |
| 0x04 | 4 | uint32 | Version (e.g., `0x10000003` = v3.01) |
| 0x08 | 4 | uint32 | Number of textures |
| 0x0C | 4 | uint32 | Texture data offset |
| 0x10 | 4 | uint32 | Total texture data size |
| 0x14 | 4 | uint32 | Number of P4 (16-entry) palettes |
| 0x18 | 4 | uint32 | Number of P8 (256-entry) palettes |
| 0x1C | 4 | uint32 | Padding (0x00000000) |

### Texture Info Structure (per texture, starting at 0x20)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0x00 | 4 | uint32 | Data offset |
| 0x04 | 4 | uint32 | Data size |
| 0x08 | 4 | int32 | Palette index (-1 if none) |
| 0x0C | 4 | uint32 | Flags |
| 0x10 | 4 | uint32 | Texture type |
| 0x14 | 4 | uint32 | Base format |
| 0x18 | 2 | uint16 | Width |
| 0x1A | 2 | uint16 | Height |
| 0x1C | 2 | uint16 | Mipmap count |
| 0x1E | 2 | uint16 | Padding |

### Version Values

| Version | Value |
|---------|-------|
| 1.01 | `0x10000001` |
| 2.01 | `0x10000002` |
| 3.01 | `0x10000003` |

### Texture Types

| Name | Value | Description |
|------|-------|-------------|
| SWIZZLED | 0x00 | Morton-order swizzled |
| LINEAR_STRIDED | 0x0C | Linear with stride |
| CUBE | 0x40 | Cubemap |
| LINEAR | 0x60 | Linear layout |
| TILED | 0x80 | Tiled layout |

### Texture Base Formats

| Format | Value | Description |
|--------|-------|-------------|
| PVRT2BPP | 0x80000000 | PVR 2 bits/pixel |
| PVRT4BPP | 0x81000000 | PVR 4 bits/pixel |
| PVRTII2BPP | 0x82000000 | PVR II 2 bits/pixel |
| PVRTII4BPP | 0x83000000 | PVR II 4 bits/pixel |
| UBC1 (DXT1) | 0x85000000 | DXT1 (no alpha) |
| UBC2 (DXT3) | 0x86000000 | DXT3 |
| UBC3 (DXT5) | 0x87000000 | DXT5 |
| ARGB8888 | 0x0C000010 | 32-bit ARGB |
| RGB565 | 0x05000010 | 16-bit RGB |
| ARGB4444 | 0x00000010 | 16-bit ARGB |
| ARGB1555 | 0x00040010 | 16-bit ARGB (1-bit alpha) |

### Palette Data

Located at the end of texture data:
- P4 palettes: 16 entries × 4 bytes = 64 bytes each
- P8 palettes: 256 entries × 4 bytes = 1024 bytes each
- Position: `TextureDataOffset + TextureDataSize - TotalPaletteSize`

## Example Files

Found in: `dr1_data.wad/Dr1/data/all/modelbg/bg_*/0004`, `bg_*/0005`

These are compressed GXT textures used for background model textures.

## Tools

- [GXTConvert](https://github.com/xdanieldzd/GXTConvert) - PS Vita GXT to PNG converter (unmaintained)
- [Scarlet](https://github.com/xdanieldzd/Scarlet) - Multi-format image converter including GXT
- [Danganronpa Another Tool](https://github.com/Liquid-S/Danganronpa-Another-Tool) - Uses psp2gxt.exe and ScarletTestApp for GXT conversion

## References

- [PS Vita Dev Wiki - GXT](https://www.psdevwiki.com/vita/GXT)
- [Scarlet GXT.cs source](https://github.com/xdanieldzd/Scarlet/blob/master/Scarlet.IO.ImageFormats/GXT.cs)
- [Scarlet SpikeDRVita.cs decompression](https://github.com/xdanieldzd/Scarlet/blob/master/Scarlet.IO.CompressionFormats/SpikeDRVita.cs)
- [Kuriimu2 ShadeLzDecoder.cs](https://github.com/FanTranslatorsInternational/Kuriimu2/blob/master/src/lib/Kompression/Decoder/ShadeLzDecoder.cs) - Reference implementation
- [PSP2SDK gxt.h](https://psp2sdk.github.io/gxt_8h.html)
- [Kuriimu Issue #351 - Danganronpa compression](https://github.com/IcySon55/Kuriimu/issues/351)
