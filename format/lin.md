# LIN - Script Format

LIN is a format used for scripting in the game engine used for Danganronpa 1 and 2. This document will only contain information on Danganronpa 1, as I have not verified any of this for DR2.

## Opcodes

The LIN format consists of opcodes and arguments. For Danganronpa Trigger Happy Havoc, there are 48 opcodes present in the game's .lin files. Interestingly, these 48 opcodes are not all continguous, meaning there may be some opcodes unused in the engine.

### Quick Note
This is just a summary. For more on these, find the corresponding `*-meta.ts` in `vscode-extension/src/metadata/` with more details on the opcodes and their parameters.

### How to read this
 - All numbers are unsigned integers.
 - Byte means an unsigned 8 bit number
 - 16LE means an unsigned 16 bit little endian number
 - 16BE means an unsigned 16 bit big endian number

Opcode | Name| Description | Arguments
-|-|-|-
`0x00` | ScriptType | This defines how many Text opcodes are used within the LIN file.  | 16LE
`0x01` | LoadSprite | Not much known. | 3 bytes. Not much known.
`0x02` | Text | Contains an index to the text dictionary | 16LE
`0x03` | TextStyle | Contains the text style, used in conjunction with \<CLT> tags. It's not clear why this is required for the text decoration to work. | Text style ID.
`0x04` | PostProcessingEffect | A fullscreen filter | 4 args, not confirmed.
`0x05` | Movie | Plays a video | Byte movie ID, second argument unknown
`0x06` | Animation | Plays an animation | 16BE animation ID, then 6 unknown arguments
`0x07` | __unused__
`0x08` | Voice | Plays character audio. This is organised by chapter and by character, and the arguments select the clip using these groups. | Byte character ID, Byte chapter, 16BE voice ID, Byte volume
`0x09` | Music | Play music audio. | Byte music ID, Byte volume, Byte fade in frames
`0x0A` | Sound | Play sound effect. | 16BE sound ID. Byte volume
`0x0B` | SoundB | Play sound effect from a different bank. | 16BE sound ID. Byte volume
`0x0C` | TruthBulletFlag | Add or remove truth bullets | Byte operation, Byte value