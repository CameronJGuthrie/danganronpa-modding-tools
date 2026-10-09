import { instructions } from "../instructions";
import type { LinscriptInstruction } from "../instructions/linscript-instruction";
import { type ArgumentNameSource, type ArgumentNames, dependentTable, isDependent, isInsideQuotes } from "./string-util";

/** An instruction call found on a line: its name, where the name starts and where the call ends. */
export type CallAt = { name: string; nameStart: number; end: number };

/**
 * The innermost instruction call whose name or parentheses contain `character` on this line, if
 * any. The closing parenthesis may be missing (a multi-line `Text(...)`, or a call still being
 * typed), in which case the call runs to the end of the line and includes the position just past it.
 */
export function findCallAt(lineText: string, character: number): CallAt | undefined {
  const pattern = /([A-Za-z_]\w*)\s*\(/g;
  let innermost: CallAt | undefined;
  let match: RegExpExecArray | null = pattern.exec(lineText);
  while (match) {
    const nameStart = match.index;
    if (!isInsideQuotes(lineText, nameStart)) {
      const openParen = nameStart + match[0].length - 1;
      const closeParen = findClosingParen(lineText, openParen);
      // An unclosed call runs to the end of the line, and a cursor at the very end is still inside it
      const end = closeParen === -1 ? lineText.length + 1 : closeParen + 1;
      if (character >= nameStart && character < end) {
        // Later matches start further right, so a match containing the position is nested inside
        // any earlier one that also contains it: keep the innermost, e.g. Wait(10) within Text(...)
        innermost = { name: match[1], nameStart, end };
      }
    }
    match = pattern.exec(lineText);
  }
  return innermost;
}

/** Index of the parenthesis closing the one at `openParen`, ignoring parentheses inside quotes. */
export function findClosingParen(text: string, openParen: number): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = openParen; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i - 1] !== "\\") {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === "(") {
      depth += 1;
    } else if (!inQuotes && char === ")") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Which comma-separated argument of `callText` (starting at the name) contains `offset`, or
 * undefined when the offset is on the name or past the closing parenthesis. Commas inside quotes
 * and inside a nested call (a condition's `Goto(label)`) do not count.
 */
export function argumentIndexAt(callText: string, offset: number): number | undefined {
  const openParen = callText.indexOf("(");
  if (openParen === -1 || offset <= openParen) {
    return undefined;
  }
  let index = 0;
  let depth = 0;
  let inQuotes = false;
  for (let i = openParen + 1; i < offset && i < callText.length; i++) {
    const char = callText[i];
    if (char === '"' && callText[i - 1] !== "\\") {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      if (depth === 0) {
        return undefined;
      }
      depth -= 1;
    } else if (char === "," && depth === 0) {
      index += 1;
    }
  }
  return index;
}

export function lookupInstruction(name: string): LinscriptInstruction | undefined {
  return Object.hasOwn(instructions, name) ? instructions[name as keyof typeof instructions] : undefined;
}

/** The concrete name table for one argument, following a dependent table to the argument it keys on. */
export function resolveTable(
  source: ArgumentNameSource,
  args: readonly { value: number }[],
  argIndex: number,
): ArgumentNames | undefined {
  if (!isDependent(source)) {
    return source;
  }
  return dependentTable(source, args[argIndex + source.argument]?.value);
}
