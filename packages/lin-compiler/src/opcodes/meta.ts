import type { NamedValues, ScopeTables } from "../definitions/parameter.definition.ts";
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
 *
 * `Object(id, Name)` names an object id, so the body can say `OnObject(Monitor)` instead of
 * `OnObject(20)`. Names are identifiers, unique within the file, and each id is named once. The
 * block is terminated by the end of the file; nothing but `Object` entries, blank lines and
 * comments may follow it. Compiling to `.lin` drops the block, and decompiling produces none.
 */

/** Source name of the block opener. */
export const META = "Meta";
/** Source name of an object-name entry inside the block. */
export const META_OBJECT = "Object";

const IDENTIFIER = /^[A-Za-z_]\w*$/;
/** The largest object id a `Meta()` block may name; 255 closes an `OnObject` block. */
const MAX_OBJECT_ID = 254;

/** One line of source with its 1-based line number, as the reader has already trimmed it. */
export interface SourceLine {
  line: number;
  text: string;
}

/**
 * Parse the `Meta()` block from the given `Object(...)` lines. The reader has already found the
 * block opener; `lines` are the non-blank, non-comment lines after it.
 */
export function parseMeta(lines: readonly SourceLine[]): ScriptMeta {
  const objects: Record<number, string> = {};
  const seen = new Set<string>();

  for (const { line, text } of lines) {
    const match = /^(\w+)\s*\((.*)\)$/.exec(text);
    if (match === null || match[1] !== META_OBJECT) {
      throw new SourceError(line, `only ${META_OBJECT}(id, Name) entries may follow ${META}()`);
    }
    const values = splitArgs(match[2]);
    if (values.length !== 2) {
      throw new SourceError(line, `${META_OBJECT} expects 2 arguments, got ${values.length}`);
    }
    const [idText, name] = values.map((value) => value.trim());
    const id = Number(idText);
    if (!/^\d+$/.test(idText) || id > MAX_OBJECT_ID) {
      throw new SourceError(line, `object id must be a number from 0 to ${MAX_OBJECT_ID}, got '${idText}'`);
    }
    if (!IDENTIFIER.test(name)) {
      throw new SourceError(line, `object name must be an identifier, got '${name}'`);
    }
    if (id in objects) {
      throw new SourceError(line, `object ${id} is already named '${objects[id]}'`);
    }
    if (seen.has(name)) {
      throw new SourceError(line, `object name '${name}' is already used`);
    }
    objects[id] = name;
    seen.add(name);
  }

  return { objects };
}

/** Render the `Meta()` block, or nothing when there is nothing to record. */
export function formatMeta(meta: ScriptMeta | undefined, indent: string): string[] {
  const ids = Object.keys(meta?.objects ?? {})
    .map(Number)
    .sort((a, b) => a - b);
  if (ids.length === 0) {
    return [];
  }
  return [
    `${META}()`,
    ...ids.map((id) => `${indent}${META_OBJECT}(${id}, ${(meta as ScriptMeta).objects[id]})`),
  ];
}

/**
 * The scoped name tables a script's meta provides for reading and writing its arguments. A script
 * without meta still gets an empty object table, so a stray name is reported as unknown rather
 * than as a malformed number.
 */
export function scopeTables(meta: ScriptMeta | undefined): ScopeTables {
  const table: Record<string, string | number> = {};
  for (const [id, name] of Object.entries(meta?.objects ?? {})) {
    table[id] = name;
    table[name] = Number(id);
  }
  return { Object: table as NamedValues };
}
