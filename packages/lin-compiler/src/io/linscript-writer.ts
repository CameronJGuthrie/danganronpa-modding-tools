import { writeFile } from "node:fs/promises";
import { Opcode } from "../definitions/opcode.definition.ts";
import { BinaryError } from "../errors.ts";
import type { Script, ScriptEntry } from "../definitions/script.definition.ts";
import { formatArgs } from "../opcodes/arguments.ts";
import { branchJump, formatBranch, isConditionEntry } from "../opcodes/branch.ts";
import { getOpcode, hexOpcodeName } from "../opcodes/lookup.ts";
import { formatMeta, scopeTables } from "../opcodes/meta.ts";
import { formatMode, MODE, planModeSugar, type ModePlan } from "../opcodes/mode.ts";
import { formatOption, OPTION, planOptionSugar } from "../opcodes/option.ts";
import { formatPresent, isPresent } from "../opcodes/present.ts";
import { planTextSugar, textSourceForm, TEXT_SUGAR } from "../opcodes/textSugar.ts";
import { formatTime, isTime, TIME } from "../opcodes/time.ts";
import { formatWait, isWait, WAIT } from "../opcodes/wait.ts";

export interface WriteSourceOptions {
  /** Spaces per indentation level. */
  indentSpaces?: number;
}

export const DEFAULT_INDENT_SPACES = 4;

/** Decompiled files start with a UTF-8 BOM, matching the original C# tool byte for byte. */
const UTF8_BOM = "\uFEFF";

/** A block opcode with this argument closes its block instead of opening one. */
const BLOCK_CLOSE = 255;

/** Render a script as `.linscript` source. */
export function writeSourceText(script: Script, options: WriteSourceOptions = {}): string {
  const indent = " ".repeat(options.indentSpaces ?? DEFAULT_INDENT_SPACES);
  const { entries } = script;
  const { sugared, skipped, trailing } = planTextSugar(entries);
  const optionSugared = planOptionSugar(entries);
  for (const index of optionSugared) {
    skipped.add(index + 1);
    skipped.add(index + 2);
  }
  // The UI toggles are written as part of the Mode(...) that stands where their Speaker was
  const modeSugared = planModeSugar(entries, skipped);
  for (const plan of modeSugared.values()) {
    for (const toggle of [plan.thinking, plan.name]) {
      if (toggle !== undefined) {
        skipped.add(toggle);
      }
    }
  }
  const scopes = scopeTables(script.meta);
  // Every condition must carry its Then + Goto, which are written as the condition's last argument
  entries.forEach((entry, index) => {
    if (isConditionEntry(entry)) {
      branchJump(entries, index);
      skipped.add(index + 1);
      skipped.add(index + 2);
    } else if (entry.opcode === Opcode.Then && !skipped.has(index)) {
      throw new BinaryError("Then without a preceding condition; only If* + Then + Goto branches are understood");
    }
  });

  /** The table row for an entry; source has no spelling for an opcode outside the table. */
  const knownOpcode = (entry: ScriptEntry) => {
    const opcode = getOpcode(entry.opcode);
    if (opcode === undefined) {
      throw new BinaryError(`unknown opcode ${hexOpcodeName(entry.opcode)} with ${entry.args.length} argument byte(s)`);
    }
    return opcode;
  };

  /** One instruction as `Name(args)`, applying the Wait, Time and Present sugar and named arguments. */
  const formatEntry = (entry: ScriptEntry): string => {
    const opcode = knownOpcode(entry);
    if (isWait(entry)) {
      return `${WAIT}(${formatWait(entry)})`;
    }
    if (isTime(entry)) {
      return `${TIME}(${formatTime(entry)})`;
    }
    if (isPresent(entry)) {
      const { name, args } = formatPresent(entry);
      return `${name}(${args})`;
    }
    return `${opcode.name}(${formatArgs(opcode.args, entry, { scopes })})`;
  };

  const lines: string[] = [];
  // Each block opcode indents independently; nesting depth is the number currently open
  const openBlocks = new Set<string>();

  /**
   * A statement whose arguments end in nested instruction calls, written one per line and one
   * level deeper than the statement itself:
   *
   *     IfFlag(Unknown, 0, !=, False,
   *         Goto(501))
   */
  const formatNested = (name: string, head: string, nested: readonly string[], depth: number): string => {
    if (nested.length === 0) {
      return `${name}(${head})`;
    }
    const inner = indent.repeat(depth + 1);
    return `${name}(${head},\n${nested.map((call) => `${inner}${call}`).join(",\n")})`;
  };

  entries.forEach((entry, index) => {
    // Type is implied by the presence of Text opcodes and regenerated on compile
    if (skipped.has(index) || entry.opcode === Opcode.Type) {
      return;
    }

    const opcode = knownOpcode(entry);
    const block = opcode.block && entry.args.length > 0 ? opcode.name : null;
    if (block !== null) {
      // A block opcode always ends the previous block of its kind before writing
      openBlocks.delete(block);
    }

    const depth = openBlocks.size;
    let call: string;
    if (isConditionEntry(entry)) {
      const { conditions, jump } = formatBranch(opcode, entry, entries[index + 2], scopes);
      call = formatNested(opcode.name, conditions, [jump], depth);
    } else if (modeSugared.has(index)) {
      call = `${MODE}(${formatMode(modeSugared.get(index) as ModePlan, entries, entry)})`;
    } else if (optionSugared.has(index)) {
      call = `${OPTION}(${formatOption(entries, index, scopes)})`;
    } else if (sugared.has(index) && "text" in entry) {
      // The plan only sugars entries that have a source form
      const text = textSourceForm(entry.text) ?? entry.text;
      const head = formatArgs(opcode.args, { ...entry, text }, { scopes });
      const nested = (trailing.get(index) ?? []).map((i) => formatEntry(entries[i]));
      call = formatNested(TEXT_SUGAR, head, nested, depth);
    } else {
      call = formatEntry(entry);
    }
    lines.push(`${indent.repeat(depth)}${call}`);

    if (block !== null && entry.args[0] !== BLOCK_CLOSE) {
      openBlocks.add(block);
    }
  });

  const meta = formatMeta(script.meta, indent);
  if (meta.length > 0) {
    lines.push("", ...meta);
  }

  return lines.map((line) => `${line}\n`).join("");
}

export async function writeSourceFile(script: Script, path: string, options: WriteSourceOptions = {}): Promise<void> {
  await writeFile(path, UTF8_BOM + writeSourceText(script, options), "utf8");
}
