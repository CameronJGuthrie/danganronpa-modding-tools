import type { LinscriptInstruction } from "../instructions/linscript-instruction";
import { type ScopedNames, scopedNamesFromDocument } from "./script-meta";
import { getArgumentsFromFunctionLike } from "./string-util";

/**
 * Name tables per argument position, expanding a varargs head/tail pattern to the actual count.
 * Parameters scoped to the document (object, character, option and label ids) take their table
 * from its `Meta()` block. A caller resolving many calls in one document passes the block's
 * tables (`scopedNamesFromDocument`) so it is parsed once rather than per call.
 */
export function argumentNames(functionDetails: LinscriptInstruction, call: string, document: string | ScopedNames) {
  const { varargNames } = functionDetails;
  if (!functionDetails.varargs || !varargNames) {
    const scoped = typeof document === "string" ? scopedNamesFromDocument(document) : document;
    return functionDetails.parameters.map((parameter) =>
      parameter.scope ? scoped[parameter.scope] : (parameter.namesBy ?? parameter.names),
    );
  }
  const count = getArgumentsFromFunctionLike(call).length;
  const { head, tail } = varargNames;
  return Array.from({ length: count }, (_, i) =>
    i < head.length ? head[i] : tail.length === 0 ? undefined : tail[(i - head.length) % tail.length],
  );
}
