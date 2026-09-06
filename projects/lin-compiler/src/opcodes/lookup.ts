import { type ArgumentSpec, type OpcodeName, opcodes } from "../definitions/opcode.definition.ts";

/** One row of the opcode table together with its source name. */
export interface OpcodeInfo {
  id: number;
  name: OpcodeName;
  args: ArgumentSpec;
  block: boolean;
}

const all: readonly OpcodeInfo[] = (Object.entries(opcodes) as [OpcodeName, (typeof opcodes)[OpcodeName]][]).map(
  ([name, row]) => ({ id: row.id, name, args: row.args, block: "block" in row }),
);

const byId = new Map<number, OpcodeInfo>(all.map((info) => [info.id, info]));
const byName = new Map<string, OpcodeInfo>(all.map((info) => [info.name, info]));

export function getOpcode(id: number): OpcodeInfo | undefined {
  return byId.get(id);
}

/** Look up an opcode by its source name, accepting `0xNN` for registered ids. */
export function getOpcodeByName(name: string): OpcodeInfo | undefined {
  const hexId = parseHexOpcodeName(name);
  return hexId === undefined ? byName.get(name) : byId.get(hexId);
}

/** The `0xNN` form used for opcodes with no name. */
export function hexOpcodeName(id: number): string {
  return `0x${id.toString(16).toUpperCase().padStart(2, "0")}`;
}

/** Inverse of `hexOpcodeName`; undefined when `name` is not of that form. */
export function parseHexOpcodeName(name: string): number | undefined {
  return /^0x[0-9a-f]{1,2}$/i.test(name) ? Number.parseInt(name.slice(2), 16) : undefined;
}
