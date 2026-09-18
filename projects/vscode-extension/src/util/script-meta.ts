import type { ArgumentNames } from "./string-util";

/** Matches one `Object(id, Name)` entry of a file's `Meta()` block. */
const OBJECT_ENTRY = /^\s*Object\(\s*(\d+)\s*,\s*([A-Za-z_]\w*)\s*\)/gm;

/**
 * The object names a `.linscript` file declares in its `Meta()` block, as a two-way table like an
 * enum (`{ 20: "Monitor", Monitor: 20 }`) so it can stand in for a parameter's `names`.
 */
export function objectNamesFromDocument(documentText: string): ArgumentNames {
  const metaStart = documentText.search(/^\s*Meta\(\s*\)\s*$/m);
  if (metaStart === -1) {
    return {};
  }
  const table: Record<string, string | number> = {};
  for (const match of documentText.slice(metaStart).matchAll(OBJECT_ENTRY)) {
    const id = Number(match[1]);
    table[id] = match[2];
    table[match[2]] = id;
  }
  return table;
}
