import type { ArgumentNames, ParameterScopeName } from "./string-util";

/** Option ids every script can name without declaring them; mirrors `DEFAULT_OPTION_NAMES` in lin-compiler. */
export const DEFAULT_OPTION_NAMES: Readonly<Record<number, string>> = { 18: "Exit_1", 19: "Exit_2" };

/**
 * The object names a `.linscript` file declares in its `Meta()` block, as a two-way table like an
 * enum (`{ 20: "Monitor", Monitor: 20 }`) so it can stand in for a parameter's `names`.
 */
export function objectNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "ObjectName", {});
}

/** The character-slot names a file declares with `CharacterName(id, Name)`, for `OnCharacter`. */
export function characterNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "CharacterName", {});
}

/** The option names in effect for a file: the defaults plus its `Meta()` block's `OptionName(id, Name)` entries. */
export function optionNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "OptionName", DEFAULT_OPTION_NAMES);
}

/** The label names a file declares with `LabelName(id, Name)`, for `Label` and `Goto`. */
export function labelNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "LabelName", {});
}

/** The SceneFlags slot names a file declares with `SceneFlagName(id, Name)`, for `SetFlag` and `IfFlag` on that group. */
export function sceneFlagNamesFromDocument(documentText: string): ArgumentNames {
  return declaredNamesFromDocument(documentText, "SceneFlagName", {});
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

/** The `Meta()` entry that declares names for a scoped parameter: the scope with `Name` appended, e.g. `LabelName`. */
export function metaEntryForScope(scope: ParameterScopeName): MetaEntryName {
  return `${scope}Name`;
}

/** The entries a `Meta()` block may hold, mirroring `META_*` in lin-compiler's `opcodes/meta.ts`. */
export type MetaEntryName = `${ParameterScopeName}Name`;

function declaredNamesFromDocument(
  documentText: string,
  entry: MetaEntryName,
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
