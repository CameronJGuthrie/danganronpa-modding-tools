import { type ArgumentSpec, type OpcodeName, opcodes } from "../definitions/opcode.definition.ts";

/** One row of the opcode table together with its source name. */
export interface OpcodeInfo {
  id: number;
  name: OpcodeName;
  args: ArgumentSpec;
  block: boolean;
  /** See `OpcodeRow.hidden`: only reachable from source through sugar. */
  hidden: boolean;
}

const all: readonly OpcodeInfo[] = (Object.entries(opcodes) as [OpcodeName, (typeof opcodes)[OpcodeName]][]).map(
  ([name, row]) => ({ id: row.id, name, args: row.args, block: "block" in row, hidden: "hidden" in row }),
);

const byId = new Map<number, OpcodeInfo>(all.map((info) => [info.id, info]));
const byName = new Map<string, OpcodeInfo>(all.map((info) => [info.name, info]));

export function getOpcode(id: number): OpcodeInfo | undefined {
  return byId.get(id);
}

/** Look up an opcode by its source name. */
export function getOpcodeByName(name: string): OpcodeInfo | undefined {
  return byName.get(name);
}

/** The `0xNN` form used for opcodes with no name and for `--hex` output. Not readable as source. */
export function hexOpcodeName(id: number): string {
  return `0x${id.toString(16).toUpperCase().padStart(2, "0")}`;
}
