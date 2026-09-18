import { writeFile } from "node:fs/promises";
import { Opcode } from "../definitions/opcode.definition.ts";
import type { Script } from "../definitions/script.definition.ts";
import { formatArgs, formatRawBytes } from "../opcodes/arguments.ts";
import { getOpcode, hexOpcodeName } from "../opcodes/lookup.ts";
import { formatMeta, scopeTables } from "../opcodes/meta.ts";
import { formatPresent, isPresent } from "../opcodes/present.ts";
import { planTextSugar, stripImplicitNewline, TEXT_SUGAR } from "../opcodes/textSugar.ts";
import { formatWait, isWait, WAIT } from "../opcodes/wait.ts";

export interface WriteSourceOptions {
  /** Spaces per indentation level. */
  indentSpaces?: number;
  /** Write every opcode as `0xNN` instead of its name, and every argument as a number. */
  hexOpcodes?: boolean;
}

export const DEFAULT_INDENT_SPACES = 2;

/** Decompiled files start with a UTF-8 BOM, matching the original C# tool byte for byte. */
const UTF8_BOM = "\uFEFF";

/** A block opcode with this argument closes its block instead of opening one. */
const BLOCK_CLOSE = 255;

/** Render a script as `.linscript` source. */
export function writeSourceText(script: Script, options: WriteSourceOptions = {}): string {
  const indent = " ".repeat(options.indentSpaces ?? DEFAULT_INDENT_SPACES);
  const { entries } = script;
  const { sugared, skipped } = planTextSugar(entries);
  // Hex output is the raw view, so per-script names are left out of it along with the Meta block
  const names = !options.hexOpcodes;
  const scopes = names ? scopeTables(script.meta) : {};

  const lines: string[] = [];
  // Each block opcode indents independently; nesting depth is the number currently open
  const openBlocks = new Set<string>();

  entries.forEach((entry, index) => {
    // Type is implied by the presence of Text opcodes and regenerated on compile
    if (skipped.has(index) || entry.opcode === Opcode.Type) {
      return;
    }

    const opcode = getOpcode(entry.opcode);
    const block = opcode?.block && entry.args.length > 0 ? opcode.name : null;
    if (block !== null) {
      // A block opcode always ends the previous block of its kind before writing
      openBlocks.delete(block);
    }

    let name: string;
    let args: string;
    if (opcode === undefined) {
      name = hexOpcodeName(entry.opcode);
      args = formatRawBytes(entry.args);
    } else if (!options.hexOpcodes && isWait(entry)) {
      name = WAIT;
      args = formatWait(entry);
    } else if (!options.hexOpcodes && isPresent(entry)) {
      ({ name, args } = formatPresent(entry));
    } else if (sugared.has(index) && "text" in entry) {
      name = TEXT_SUGAR;
      // The plan only sugars entries whose text carries the implicit newline
      const text = stripImplicitNewline(entry.text) ?? entry.text;
      args = formatArgs(opcode.args, { ...entry, text }, { names, scopes });
    } else {
      name = names ? opcode.name : hexOpcodeName(entry.opcode);
      args = formatArgs(opcode.args, entry, { names, scopes });
    }
    lines.push(`${indent.repeat(openBlocks.size)}${name}(${args})`);

    if (block !== null && entry.args[0] !== BLOCK_CLOSE) {
      openBlocks.add(block);
    }
  });

  if (names) {
    const meta = formatMeta(script.meta, indent);
    if (meta.length > 0) {
      lines.push("", ...meta);
    }
  }

  return lines.map((line) => `${line}\n`).join("");
}

export async function writeSourceFile(script: Script, path: string, options: WriteSourceOptions = {}): Promise<void> {
  await writeFile(path, UTF8_BOM + writeSourceText(script, options), "utf8");
}
