/** Process-wide flags that mirror the original compiler's static Program state. */
export const options = {
  silent: false,
  useHexOpcodes: false,
};

export function printLine(line: string): void {
  if (!options.silent) {
    console.log(line);
  }
}

export function toHexOpcode(opcode: number): string {
  return `0x${opcode.toString(16).toUpperCase().padStart(2, "0")}`;
}
