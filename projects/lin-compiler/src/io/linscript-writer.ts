import { writeFile } from "node:fs/promises";
import { Opcode } from "../definitions/opcode.definition.ts";
import type { Script } from "../definitions/script.definition.ts";
import { planAutoText } from "../opcodes/autoTextOpcode.ts";
import { formatRawBytes } from "../opcodes/baseOpcode.ts";
import { getOpcode, hexOpcodeName } from "../opcodes/opcodeDictionary.ts";

export interface WriteSourceOptions {
  /** Spaces per indentation level. */
  indentSpaces?: number;
  /** Write every opcode as `0xNN` instead of its name. */
  hexOpcodes?: boolean;
}

export const DEFAULT_INDENT_SPACES = 2;

/** Decompiled files start with a UTF-8 BOM, matching the original C# tool byte for byte. */
const UTF8_BOM = "\uFEFF";

/** Opcodes that open an indented block; an argument of 255 closes it instead. */
const BLOCK_OPCODES = new Set(["SetOption", "CheckObject", "CheckCharacter"]);
const BLOCK_CLOSE = 255;

/** Render a script as `.linscript` source. */
export function writeSourceText(script: Script, options: WriteSourceOptions = {}): string {
  const indent = " ".repeat(options.indentSpaces ?? DEFAULT_INDENT_SPACES);
  const { entries } = script;
  const { autoText, skipped } = planAutoText(entries);

  const lines: string[] = [];
  // Each block opcode indents independently; nesting depth is the number currently open
  const openBlocks = new Set<string>();

  entries.forEach((entry, index) => {
    // Type is implied by the presence of Text opcodes and regenerated on compile
    if (skipped.has(index) || entry.opcode === Opcode.Type) {
      return;
    }

    const opcode = getOpcode(entry.opcode);
    const block = opcode !== undefined && BLOCK_OPCODES.has(opcode.name) && entry.args.length > 0 ? opcode.name : null;
    if (block !== null) {
      // A block opcode always ends the previous block of its kind before writing
      openBlocks.delete(block);
    }

    let name: string;
    let args: string;
    if (opcode === undefined) {
      name = hexOpcodeName(entry.opcode);
      args = formatRawBytes(entry.args);
    } else {
      name = autoText.has(index) ? "AutoText" : options.hexOpcodes ? hexOpcodeName(entry.opcode) : opcode.name;
      args = opcode.formatArgs(entry);
    }
    lines.push(`${indent.repeat(openBlocks.size)}${name}(${args})`);

    if (block !== null && entry.args[0] !== BLOCK_CLOSE) {
      openBlocks.add(block);
    }
  });

  return lines.map((line) => `${line}\n`).join("");
}

export async function writeSourceFile(script: Script, path: string, options: WriteSourceOptions = {}): Promise<void> {
  await writeFile(path, UTF8_BOM + writeSourceText(script, options), "utf8");
}
