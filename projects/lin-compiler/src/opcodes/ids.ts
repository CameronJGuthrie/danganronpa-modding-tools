/** Every opcode in the compiled script data is introduced by this marker byte. */
export const OPCODE_MARKER = 0x70;

/** Binary opcode ids referenced by name elsewhere in the compiler. */
export const OP_TYPE = 0x00;
export const OP_TEXT = 0x02;
export const OP_TEXT_STYLE = 0x03;
export const OP_WAIT_INPUT = 0x3a;
export const OP_WAIT_FRAME = 0x3b;
