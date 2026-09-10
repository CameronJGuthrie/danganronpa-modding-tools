/**
 * One source argument: a decimal number, or a bare identifier such as a character name
 * (`Speaker(Makoto)`). Names are resolved to numbers by `getArgumentsFromFunctionLike`.
 */
const ARGUMENT = "(?:\\d+|[A-Za-z_]\\w*)";

/** A numeric enum object (or similar table) mapping argument names to their values. */
export type ArgumentNames = Readonly<Record<string, string | number>>;

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

export function createCompleteFunctionRegex(functionName: string, numArgs: number): RegExp {
  // Create the regex pattern based on the function name and the number of arguments
  const argsPattern = Array(numArgs).fill(`\\s*${ARGUMENT}\\s*`).join(",\\s*");

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
  // Create the regex pattern based on the function name and the number of arguments
  const regexPattern = /Text\(".*?"\)/g;

  return regexPattern;
}

export function getColorTextRegex(): RegExp {
  const regexPattern = /<CLT (\d+)>(.*?)<CLT>/g;

  return new RegExp(regexPattern);
}

/**
 * Extract the arguments of a call such as `Speaker(Makoto)` or `Sound(219, 100)`.
 *
 * Each argument is returned with its offset in `functionLike` and its numeric value. A named
 * argument is resolved through `names[argIndex]` when given; a name with no table (or one that is
 * not in the table) yields `NaN`.
 */
export function getArgumentsFromFunctionLike(functionLike: string, names: readonly (ArgumentNames | undefined)[] = []) {
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

      results.push({ stringIndex: startIndex, value: resolveArgument(param, names[argIndex]) });

      currentIndex = startIndex + param.length;
    });

    return results;
  }

  return []; // Return empty array if no match is found
}

function resolveArgument(text: string, names: ArgumentNames | undefined): number {
  if (/^\d+$/.test(text)) {
    return Number(text);
  }
  const value = names && Object.hasOwn(names, text) ? names[text] : undefined;
  return typeof value === "number" ? value : Number.NaN;
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
