import type { LinscriptInstruction } from "../instructions/linscript-instruction";
import { type ScopedNames, scopedNamesFromDocument } from "./script-meta";
import { type ArgumentNameSource, type ArgumentNames, getArgumentsFromFunctionLike, isDependent } from "./string-util";

/**
 * Name tables per argument position, expanding a varargs head/tail pattern to the actual count.
 * Parameters scoped to the document (object, character, option and label ids) take their table
 * from its `Meta()` block. A caller resolving many calls in one document passes the block's
 * tables (`scopedNamesFromDocument`) so it is parsed once rather than per call. A dependent table
 * with `scopes` (the SceneFlags offset of `SetFlag`/`IfFlag`) gets the block's names for that
 * scope merged into the table they extend, so later resolution needs no document.
 */
export function argumentNames(functionDetails: LinscriptInstruction, call: string, document: string | ScopedNames) {
  const { varargNames } = functionDetails;
  const scoped = typeof document === "string" ? scopedNamesFromDocument(document) : document;
  if (!functionDetails.varargs || !varargNames) {
    return functionDetails.parameters.map((parameter) =>
      parameter.scope ? scoped[parameter.scope] : bindScopes(parameter.namesBy ?? parameter.names, scoped),
    );
  }
  const count = getArgumentsFromFunctionLike(call).length;
  const head = varargNames.head.map((source) => bindScopes(source, scoped));
  const tail = varargNames.tail.map((source) => bindScopes(source, scoped));
  return Array.from({ length: count }, (_, i) =>
    i < head.length ? head[i] : tail.length === 0 ? undefined : tail[(i - head.length) % tail.length],
  );
}

/** Merge the document's scoped names into a dependent table's keyed tables where `scopes` asks for them. */
function bindScopes(source: ArgumentNameSource, scoped: ScopedNames): ArgumentNameSource {
  if (!isDependent(source) || source.scopes === undefined) {
    return source;
  }
  const tables: Record<number, ArgumentNames> = { ...source.tables };
  for (const [key, scope] of Object.entries(source.scopes)) {
    tables[Number(key)] = { ...tables[Number(key)], ...scoped[scope] };
  }
  return { ...source, tables };
}
