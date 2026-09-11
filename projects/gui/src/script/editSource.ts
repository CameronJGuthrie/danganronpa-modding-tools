/**
 * Replace the instruction on `lineNumber` (1-based, counted over the raw source including blank
 * lines) with `text`, keeping the line's original indentation.
 */
export function replaceLine(source: string, lineNumber: number, text: string): string {
  const lines = source.split("\n");
  const index = lineNumber - 1;
  if (index < 0 || index >= lines.length) {
    return source;
  }
  const original = lines[index];
  const indent = original.slice(0, original.length - original.trimStart().length);
  lines[index] = `${indent}${text}`;
  return lines.join("\n");
}
