import type { LinscriptInstruction } from "../instructions/linscript-instruction";
import { createCompleteFunctionRegex, createVarargsRegex } from "./string-util";

/** Leading parameters that source must always write, i.e. all but those with a `defaultValue`. */
export function requiredParameterCount(instruction: LinscriptInstruction): number {
  return instruction.parameters.filter((param) => param.defaultValue === undefined).length;
}

/**
 * A global regex matching every complete call of `instruction` in a document: the right number of
 * arguments (any number for varargs) and, for a condition, the trailing `Goto(label)`.
 */
export function createCallRegex(instruction: LinscriptInstruction): RegExp {
  const branch = instruction.branch === true;
  return instruction.varargs
    ? createVarargsRegex(instruction.name, branch)
    : createCompleteFunctionRegex(
        instruction.name,
        instruction.parameters.length,
        requiredParameterCount(instruction),
        branch,
      );
}
