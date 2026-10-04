import type { ArgumentNames, ParameterScopeName } from "./string-util";

/** Option ids every script can name without declaring them; mirrors `DEFAULT_OPTION_NAMES` in lin-compiler. */
export const DEFAULT_OPTION_NAMES: Readonly<Record<number, string>> = { 18: "Exit_1", 19: "Exit_2" };

/**
 * The object names a `.linscript` file declares in its `Meta()` block, as a two-way table like an
 * enum (`{ 20: "Monitor", Monitor: 20 }`) so it can stand in for a parameter's `names`.
 */
export function objectNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "Object", {});
}

/** The character-slot names a file declares with `Character(id, Name)`, for `OnCharacter`. */
export function characterNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "Character", {});
}

/** The option names in effect for a file: the defaults plus its `Meta()` block's `Option(id, Name)` entries. */
export function optionNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "Option", DEFAULT_OPTION_NAMES);
}

/** The label names a file declares with `LabelName(id, Name)`, for `Label` and `Goto`. */
export function labelNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "LabelName", {});
}

/** The SceneFlags slot names a file declares with `SceneFlag(id, Name)`, for `SetFlag` and `IfFlag` on that group. */
export function sceneFlagNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "SceneFlag", {});
}

/** The name tables a file's `Meta()` block declares, one per parameter scope. */
export type ScopedNames = Readonly<Record<ParameterScopeName, ArgumentNames>>;

/** All scoped name tables of a file, for callers that resolve many calls in one document. */
export function scopedNamesFromDocument(documentText: string): ScopedNames {
  return {
    Object: objectNamesFromDocument(documentText),
    Character: characterNamesFromDocument(documentText),
    Option: optionNamesFromDocument(documentText),
    Label: labelNamesFromDocument(documentText),
    SceneFlag: sceneFlagNamesFromDocument(documentText),
  };
}

/** The `Meta()` entry that declares names for a scoped parameter, e.g. `LabelName` for the `Label` scope. */
export function metaEntryForScope(scope: ParameterScopeName): string {
  return scope === "Label" ? "LabelName" : scope;
}

function declaredNamesFromDocument(
  documentText: string,
  entry: "Object" | "Character" | "Option" | "LabelName" | "SceneFlag",
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
