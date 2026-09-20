import { textStyleForTag } from "linscript-definitions";

/**
 * One source argument: a decimal number, a bare identifier such as a character name
 * (`Speaker(Makoto)`), or a comparison operator (`If(0, <=, 5)`). Names are resolved to numbers by
 * `getArgumentsFromFunctionLike`.
 */
const ARGUMENT = "(?:\\d+|[A-Za-z_]\\w*|[<>!=]=?)";

/** A numeric enum object (or similar table) mapping argument names to their values. */
export type ArgumentNames = Readonly<Record<string, string | number>>;

/** A name table selected by the resolved value of a nearby argument (`argument` is a relative index). */
export type DependentNames = { argument: number; tables: Readonly<Record<number, ArgumentNames>> };

/** How to resolve one argument position: a fixed table, a dependent table, or nothing. */
export type ArgumentNameSource = ArgumentNames | DependentNames | undefined;

function isDependent(source: ArgumentNameSource): source is DependentNames {
  return source !== undefined && "tables" in source;
}

export function createIncompleteFunctionRegex(functionName: string, numArgs: number): RegExp {
  // Create the regex pattern for valid arguments with optional whitespace
  const argsPattern = Array(numArgs)
    .fill(`\\s*${ARGUMENT}\\s*`) // Allow for whitespace around arguments
    .join(",\\s*");

  // Match function calls ensuring the function name is a complete word
  const regexPattern = new RegExp(
    `\\b${functionName}\\b(\\s*\\(|\\s*$|(?!(\\s*\\(\\s*(${argsPattern})\\s*\\)))\\s*\\()`,
    "gm", // 'g' for global search, 'm' for multiline
  );

  return regexPattern;
}

/**
 * Match a complete call with between `requiredArgs` and `numArgs` arguments (all `numArgs` are
 * required unless told otherwise), e.g. `Voice(a, b, c)` or `Voice(a, b, c, d)`.
 */
export function createCompleteFunctionRegex(functionName: string, numArgs: number, requiredArgs = numArgs): RegExp {
  // Create the regex pattern based on the function name and the number of arguments
  const required = Array(requiredArgs).fill(`\\s*${ARGUMENT}\\s*`).join(",\\s*");
  // Each optional argument is a further ", value" group that may be absent (none is ever the first argument)
  const optional = Array(numArgs - requiredArgs)
    .fill(`(?:,\\s*${ARGUMENT}\\s*)?`)
    .join("");
  const argsPattern = `${required}${optional}`;

  // Use negative lookbehind to ensure we're not inside quotes
  // (?<![^"]*") means: not preceded by an odd number of quotes (i.e., not inside a string)
  // However, JavaScript regex doesn't support variable-length lookbehinds well,
  // so we'll match and filter in the caller instead
  const regexPattern = new RegExp(`${functionName}\\s*\\(\\s*${argsPattern}\\s*\\)`, "g");

  return regexPattern;
}

export function createVarargsRegex(functionName: string): RegExp {
  // Match function name followed by parentheses with any number of comma-separated arguments
  // Pattern: FunctionName( arg [, arg]* )
  const regexPattern = new RegExp(`${functionName}\\s*\\(\\s*${ARGUMENT}(?:\\s*,\\s*${ARGUMENT})*\\s*\\)`, "g");

  return regexPattern;
}

export function getTextFunctionRegex(): RegExp {
  // A Text call is its string plus any trailing instruction calls: Text("...", Wait(10), SetUI(Rumble, Hidden))
  const regexPattern = /Text\(".*?"(?:\s*,\s*\w+\([^()]*\))*\s*\)/g;

  return regexPattern;
}

/**
 * Matches one styled run inside a Text/RawText string in any of the source forms:
 * `<thought>...</thought>` (group 1 = tag name), `<style 4>...<style 0>` (group 3 = id) or raw
 * `<CLT 4>...<CLT>` (group 5 = id). The styled text is group 2, 4 or 6 respectively. A wrapper
 * left open at the end of the string is matched up to the closing quote.
 */
export function getColorTextRegex(): RegExp {
  return /<([A-Za-z][A-Za-z0-9]*)>(.*?)(?:<\/\1>|(?="\)))|<style (\d+)>(.*?)(?:<style 0>|(?="\)))|<CLT (\d+)>(.*?)(?:<CLT>|(?="\)))/g;
}

/** The style id and styled text of a `getColorTextRegex` match, or undefined for a non-style tag. */
export function getColorTextMatch(
  match: RegExpExecArray,
): { styleId: number; text: string; openTagLength: number } | undefined {
  const [whole, tag, tagText, styleArg, styleText, cltArg, cltText] = match;
  if (tag !== undefined) {
    const styleId = textStyleForTag(tag);
    return styleId === undefined ? undefined : { styleId, text: tagText, openTagLength: tag.length + 2 };
  }
  if (styleArg !== undefined) {
    return { styleId: Number(styleArg), text: styleText, openTagLength: whole.indexOf(">") + 1 };
  }
  return { styleId: Number(cltArg), text: cltText, openTagLength: whole.indexOf(">") + 1 };
}

/**
 * Extract the arguments of a call such as `Speaker(Makoto)` or `Sound(219, 100)`.
 *
 * Each argument is returned with its offset in `functionLike` and its numeric value. A named
 * argument is resolved through `names[argIndex]` when given; a name with no table (or one that is
 * not in the table) yields `NaN`.
 */
export function getArgumentsFromFunctionLike(functionLike: string, names: readonly ArgumentNameSource[] = []) {
  const regex = /(\w+)\(([^)]*)\)/; // Match function calls
  const match = regex.exec(functionLike);

  if (match) {
    const params = match[2]
      .split(",")
      .map((param) => param.trim())
      .filter((param) => param !== ""); // Filter out empty strings (from empty parentheses)
    const results: { stringIndex: number; value: number }[] = [];

    // Find the opening parenthesis position to start searching for params after it
    const openParenIndex = functionLike.indexOf("(", match.index);
    let currentIndex = openParenIndex + 1;

    params.forEach((param, argIndex) => {
      const startIndex = functionLike.indexOf(param, currentIndex);

      const source = names[argIndex];
      const table = isDependent(source) ? source.tables[results[argIndex + source.argument]?.value] : source;
      results.push({ stringIndex: startIndex, value: resolveArgument(param, table) });

      currentIndex = startIndex + param.length;
    });

    return results;
  }

  return []; // Return empty array if no match is found
}

function resolveArgument(text: string, names: ArgumentNames | undefined): number {
  const value = names && Object.hasOwn(names, text) ? names[text] : undefined;
  if (typeof value === "number") {
    return value;
  }
  return /^\d+$/.test(text) ? Number(text) : Number.NaN;
}

export function countOccurances(needle: string, haystack: string) {
  return haystack.split(needle).length - 1;
}

export function isInsideQuotes(text: string, position: number): boolean {
  // Count unescaped quotes before this position
  let quoteCount = 0;
  for (let i = 0; i < position; i++) {
    if (text[i] === '"' && (i === 0 || text[i - 1] !== "\\")) {
      quoteCount++;
    }
  }
  // If odd number of quotes, we're inside a string
  return quoteCount % 2 === 1;
}

/**
 * Creates a regex that matches a function call at the start of a line with capturing groups for each argument.
 * E.g., createStartOfLineFunctionRegex("Goto", 1) => /^Goto\((\d+)\)/
 * E.g., createStartOfLineFunctionRegex("LoadScript", 3) => /^LoadScript\((\d+),\s*(\d+),\s*(\d+)\)/
 */
export function createStartOfLineFunctionRegex(functionName: string, numArgs: number): RegExp {
  const argsPattern = Array(numArgs).fill("(\\d+)").join(",\\s*");
  return new RegExp(`^${functionName}\\(${argsPattern}\\)`);
}
