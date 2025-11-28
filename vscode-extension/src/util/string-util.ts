export function createIncompleteFunctionRegex(functionName: string, numArgs: number): RegExp {
  // Create the regex pattern for valid arguments with optional whitespace
  const argsPattern = Array(numArgs)
    .fill("\\s*\\d+\\s*") // Allow for whitespace around numbers
    .join(",\\s*"); // e.g., for 2 args: '\\s*\\d+\\s*,\\s*\\d+\\s*'

  // Match function calls ensuring the function name is a complete word
  const regexPattern = new RegExp(
    `\\b${functionName}\\b(\\s*\\(|\\s*$|(?!(\\s*\\(\\s*(${argsPattern})\\s*\\)))\\s*\\()`,
    "gm", // 'g' for global search, 'm' for multiline
  );

  return regexPattern;
}

export function createCompleteFunctionRegex(functionName: string, numArgs: number): RegExp {
  // Create the regex pattern based on the function name and the number of arguments
  const argsPattern = Array(numArgs).fill("\\s*\\d+\\s*").join(",\\s*"); // e.g., for 2 args: '\\s*\\d+\\s*,\\s*\\d+\\s*'

  // Use negative lookbehind to ensure we're not inside quotes
  // (?<![^"]*") means: not preceded by an odd number of quotes (i.e., not inside a string)
  // However, JavaScript regex doesn't support variable-length lookbehinds well,
  // so we'll match and filter in the caller instead
  const regexPattern = new RegExp(`${functionName}\\s*\\(\\s*${argsPattern}\\s*\\)`, "g");

  return regexPattern;
}

export function createVarargsRegex(functionName: string): RegExp {
  // Match function name followed by parentheses with any number of comma-separated digits
  // Pattern: FunctionName( digit [, digit]* )
  const regexPattern = new RegExp(`${functionName}\\s*\\(\\s*\\d+(?:\\s*,\\s*\\d+)*\\s*\\)`, "g");

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

export function getArgumentsFromFunctionLike(functionLike: string) {
  const regex = /(\w+)\(([^)]*)\)/; // Match function calls
  const match = regex.exec(functionLike);

  if (match) {
    const params = match[2]
      .split(",")
      .map((param) => param.trim())
      .filter((param) => param !== ""); // Filter out empty strings (from empty parentheses)
    const results: { stringIndex: number; value: number }[] = [];

    let currentIndex = match.index + match[0].indexOf(match[2]); // Start index of parameters

    params.forEach((param) => {
      const startIndex = functionLike.indexOf(param, currentIndex);

      results.push({ stringIndex: startIndex, value: Number(param) });

      currentIndex = startIndex + param.length;
    });

    return results;
  }

  return []; // Return empty array if no match is found
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
