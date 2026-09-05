import { SourceError } from "../errors.ts";
import { byteSize, decodeValue, ParamType, parseArg, splitArgs } from "../parameter.ts";
import type { ScriptEntry } from "../script.ts";

/** Shorthand for an opcode that takes `count` plain bytes. */
export function bytes(count: number): ParamType[] {
  return new Array<ParamType>(count).fill(ParamType.Byte);
}

/**
 * Describes one opcode: its binary id, source name, and how its arguments convert between
 * the raw bytes stored on a `ScriptEntry` and the argument list written in `.linscript`.
 * Subclass to customise either direction.
 */
export class BaseOpcode {
  readonly id: number;
  readonly name: string;
  readonly params: readonly ParamType[];
  /** Variadic opcodes have no fixed byte count; the reader consumes bytes up to the next marker. */
  readonly variadic: boolean;

  constructor(id: number, name: string, params: readonly ParamType[] | number = [], variadic = false) {
    this.id = id;
    this.name = name;
    this.params = typeof params === "number" ? bytes(params) : params;
    this.variadic = variadic;
  }

  /** Total argument bytes. Meaningless for variadic opcodes. */
  get argByteCount(): number {
    return this.params.reduce((total, type) => total + byteSize(type), 0);
  }

  /** Render `entry.args` as the comma-separated argument list used in source. */
  formatArgs(entry: ScriptEntry): string {
    if (entry.args.length !== this.argByteCount) {
      // Malformed entry: keep every byte visible rather than decoding garbage
      return formatRawBytes(entry.args);
    }
    return formatByLayout(this.params, entry.args);
  }

  /** Parse a source argument list into the entries it compiles to. */
  parseSource(argsText: string, line: number): ScriptEntry[] {
    return [{ opcode: this.id, args: this.parseArgs(argsText, line) }];
  }

  /** Parse a source argument list into raw argument bytes. */
  protected parseArgs(argsText: string, line: number): number[] {
    const values = splitArgs(argsText);
    if (values.length !== this.params.length) {
      throw new SourceError(line, `${this.name} expects ${this.params.length} argument(s), got ${values.length}`);
    }
    return parseByLayout(this.params, values, line);
  }
}

/** Decode `args` according to `layout` and join the values for source output. */
export function formatByLayout(layout: readonly ParamType[], args: readonly number[]): string {
  const values: string[] = [];
  let offset = 0;
  for (const type of layout) {
    values.push(String(decodeValue(type, args, offset)));
    offset += byteSize(type);
  }
  return values.join(", ");
}

/** Encode one source value per entry of `layout`. Callers check the counts match first. */
export function parseByLayout(layout: readonly ParamType[], values: readonly string[], line: number): number[] {
  return layout.flatMap((type, i) => parseArg(type, values[i], line));
}

export function formatRawBytes(args: readonly number[]): string {
  return args.join(", ");
}
