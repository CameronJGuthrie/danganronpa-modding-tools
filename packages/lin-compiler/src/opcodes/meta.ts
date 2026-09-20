import type { NamedValues, ParameterScope, ScopeTables } from "../definitions/parameter.definition.ts";
import type { ScriptMeta } from "../definitions/script.definition.ts";
import { SourceError } from "../errors.ts";
import { splitArgs } from "../parameter.ts";

/**
 * The `Meta()` block at the bottom of a `.linscript` file holds source-only annotations for the
 * script: names that make ids readable but have no binary form. It is written last, one indented
 * entry per line:
 *
 *     Meta()
 *       Object(20, Monitor)
 *       Object(21, Camera)
 *       Option(3, Leave)
 *
 * `Object(id, Name)` names an object id, so the body can say `OnObject(Monitor)` instead of
 * `OnObject(20)`. `Option(id, Name)` names a menu option id the same way for `SetOption` and the
 * `Option(id, "label")` sugar. Every script starts with `DEFAULT_OPTION_NAMES`, which a declared
 * entry may override; only declared entries are written back. Names are identifiers, unique within
 * the file per kind, and each id is named once. The block is terminated by the end of the file;
 * nothing but these entries, blank lines and comments may follow it. Compiling to `.lin` drops
 * the block, and decompiling produces none.
 */

/** Source name of the block opener. */
export const META = "Meta";
/** Source name of an object-name entry inside the block. */
export const META_OBJECT = "Object";
/** Source name of an option-name entry inside the block (the same word as the body sugar). */
export const META_OPTION = "Option";

/**
 * Option ids every script can name without declaring them: 18 and 19 register the handlers that
 * run when the player backs out of a menu. The choices themselves (1, 2, ...) mean something
 * different in every script, so their names are declared per file in the `Meta()` block, e.g.
 * `Option(1, Yes)`.
 */
export const DEFAULT_OPTION_NAMES: Readonly<Record<number, string>> = {
  18: "Exit_1",
  19: "Exit_2",
};

const IDENTIFIER = /^[A-Za-z_]\w*$/;
/** The largest id a `Meta()` block may name; 255 closes an `OnObject` or `SetOption` block. */
const MAX_ID = 254;

/** The entry kinds the block accepts, each filling one scope's name table. */
const ENTRIES: Readonly<Record<string, { scope: ParameterScope; key: keyof ScriptMeta; noun: string }>> = {
  [META_OBJECT]: { scope: "Object", key: "objects", noun: "object" },
  [META_OPTION]: { scope: "Option", key: "options", noun: "option" },
};

/** One line of source with its 1-based line number, as the reader has already trimmed it. */
export interface SourceLine {
  line: number;
  text: string;
}

/**
 * Parse the `Meta()` block from its entry lines. The reader has already found the block opener;
 * `lines` are the non-blank, non-comment lines after it.
 */
export function parseMeta(lines: readonly SourceLine[]): ScriptMeta {
  const meta: { objects: Record<number, string>; options: Record<number, string> } = { objects: {}, options: {} };
  const seen: Record<keyof ScriptMeta, Set<string>> = { objects: new Set(), options: new Set() };

  for (const { line, text } of lines) {
    const match = /^(\w+)\s*\((.*)\)$/.exec(text);
    const entry = match === null ? undefined : ENTRIES[match[1]];
    if (match === null || entry === undefined) {
      throw new SourceError(
        line,
        `only ${META_OBJECT}(id, Name) and ${META_OPTION}(id, Name) entries may follow ${META}()`,
      );
    }
    const values = splitArgs(match[2]);
    if (values.length !== 2) {
      throw new SourceError(line, `${match[1]} expects 2 arguments, got ${values.length}`);
    }
    const [idText, name] = values.map((value) => value.trim());
    const id = Number(idText);
    if (!/^\d+$/.test(idText) || id > MAX_ID) {
      throw new SourceError(line, `${entry.noun} id must be a number from 0 to ${MAX_ID}, got '${idText}'`);
    }
    if (!IDENTIFIER.test(name)) {
      throw new SourceError(line, `${entry.noun} name must be an identifier, got '${name}'`);
    }
    const table = meta[entry.key];
    if (id in table) {
      throw new SourceError(line, `${entry.noun} ${id} is already named '${table[id]}'`);
    }
    if (seen[entry.key].has(name)) {
      throw new SourceError(line, `${entry.noun} name '${name}' is already used`);
    }
    table[id] = name;
    seen[entry.key].add(name);
  }

  // A declared option name may replace a default's name, but not reuse one for a second id
  for (const [id, name] of Object.entries(meta.options)) {
    const clash = Object.entries(DEFAULT_OPTION_NAMES).find(
      ([defaultId, defaultName]) => defaultName === name && defaultId !== id,
    );
    if (clash !== undefined && !(Number(clash[0]) in meta.options)) {
      const line =
        lines.find(({ text }) => new RegExp(`^${META_OPTION}\\s*\\(\\s*${id}\\s*,\\s*${name}\\s*\\)$`).test(text))
          ?.line ?? 0;
      throw new SourceError(line, `option name '${name}' is already used by default option ${clash[0]}`);
    }
  }

  return meta;
}

/** Render the `Meta()` block, or nothing when there is nothing to record. */
export function formatMeta(meta: ScriptMeta | undefined, indent: string): string[] {
  const lines: string[] = [];
  for (const [entryName, { key }] of Object.entries(ENTRIES)) {
    const table = meta?.[key] ?? {};
    for (const id of Object.keys(table)
      .map(Number)
      .sort((a, b) => a - b)) {
      lines.push(`${indent}${entryName}(${id}, ${table[id]})`);
    }
  }
  return lines.length === 0 ? [] : [`${META}()`, ...lines];
}

/**
 * The scoped name tables a script's meta provides for reading and writing its arguments. A script
 * without meta still gets the default option names and an empty object table, so a stray name is
 * reported as unknown rather than as a malformed number.
 */
export function scopeTables(meta: ScriptMeta | undefined): ScopeTables {
  return {
    Object: twoWay(meta?.objects ?? {}),
    Option: twoWay({ ...DEFAULT_OPTION_NAMES, ...(meta?.options ?? {}) }),
  };
}

/** An enum-like table mapping ids to names and names back to ids. */
function twoWay(names: Readonly<Record<number, string>>): NamedValues {
  const table: Record<string, string | number> = {};
  for (const [id, name] of Object.entries(names)) {
    table[id] = name;
    table[name] = Number(id);
  }
  return table;
}
