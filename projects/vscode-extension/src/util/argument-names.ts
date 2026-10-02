import type { LinscriptInstruction } from "../types/linscript-instruction";
import {
  characterNamesFromDocument,
  labelNamesFromDocument,
  objectNamesFromDocument,
  optionNamesFromDocument,
} from "./script-meta";
import { getArgumentsFromFunctionLike } from "./string-util";

/**
 * Name tables per argument position, expanding a varargs head/tail pattern to the actual count.
 * Parameters scoped to the document (object, character, option and label ids) take their table from its `Meta()` block.
 */
export function argumentNames(functionDetails: LinscriptInstruction, call: string, documentText: string) {
  const { varargNames } = functionDetails;
  if (!functionDetails.varargs || !varargNames) {
    return functionDetails.parameters.map((parameter) => {
      switch (parameter.scope) {
        case "Object":
          return objectNamesFromDocument(documentText);
        case "Character":
          return characterNamesFromDocument(documentText);
        case "Option":
          return optionNamesFromDocument(documentText);
        case "Label":
          return labelNamesFromDocument(documentText);
        default:
          return parameter.namesBy ?? parameter.names;
      }
    });
  }
  const count = getArgumentsFromFunctionLike(call).length;
  const { head, tail } = varargNames;
  return Array.from({ length: count }, (_, i) =>
    i < head.length ? head[i] : tail.length === 0 ? undefined : tail[(i - head.length) % tail.length],
  );
}
