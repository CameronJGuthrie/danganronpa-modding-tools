import type { ArgumentNames } from "./string-util";

/** Option ids every script can name without declaring them; mirrors `DEFAULT_OPTION_NAMES` in lin-compiler. */
export const DEFAULT_OPTION_NAMES: Readonly<Record<number, string>> = { 18: "Exit_1", 19: "Exit_2" };

/**
 * The object names a `.linscript` file declares in its `Meta()` block, as a two-way table like an
 * enum (`{ 20: "Monitor", Monitor: 20 }`) so it can stand in for a parameter's `names`.
 */
export function objectNamesFromDocument(documentText: string): ArgumentNames {
  return scopedNamesFromDocument(documentText, "Object", {});
}

/** The option names in effect for a file: the defaults plus its `Meta()` block's `Option(id, Name)` entries. */
export function optionNamesFromDocument(documentText: string): ArgumentNames {
  return scopedNamesFromDocument(documentText, "Option", DEFAULT_OPTION_NAMES);
}

function scopedNamesFromDocument(
  documentText: string,
  entry: "Object" | "Option",
  defaults: Readonly<Record<number, string>>,
): ArgumentNames {
  const declared: Record<number, string> = { ...defaults };
  const metaStart = documentText.search(/^\s*Meta\(\s*\)\s*$/m);
  if (metaStart !== -1) {
    const pattern = new RegExp(`^\\s*${entry}\\(\\s*(\\d+)\\s*,\\s*([A-Za-z_]\\w*)\\s*\\)`, "gm");
    for (const match of documentText.slice(metaStart).matchAll(pattern)) {
      declared[Number(match[1])] = match[2];
    }
  }
  const table: Record<string, string | number> = {};
  for (const [id, name] of Object.entries(declared)) {
    table[id] = name;
    table[name] = Number(id);
  }
  return table;
}
