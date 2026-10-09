/**
 * Helpers for the Script Viewer's text-only search: matching `Text("...")` / `TextEager("...")` / `RawText("...")`
 * lines by what the player reads rather than by the source bytes.
 */

/** The string literal that opens a `Text(`, `TextEager(` or `RawText(` statement, with the quotes stripped. */
const TEXT_STATEMENT = /^\s*(?:RawText|TextEager|Text)\(\s*"((?:[^"\\]|\\.)*)"/;

/** True for the instructions whose first argument is the text the player reads. */
export function isTextLine(functionName: string): boolean {
  return functionName === "Text" || functionName === "TextEager" || functionName === "RawText";
}

/** Style tags: role wrappers (`<thought>`, `</keyword>`), flat `<style n>` switches and raw `<CLT n>`. */
const STYLE_TAGS = /<\/?[A-Za-z][A-Za-z0-9]*>|<style \d+>|<CLT[^>]*>/g;

/**
 * The player-visible text of a linscript string literal (without its quotes): style tags are
 * dropped, escapes are resolved, and every run of whitespace (including the `\n` line breaks)
 * becomes a single space, so `we\nwent` reads `we went`.
 */
export function readableText(literal: string): string {
  return literal.replace(STYLE_TAGS, "").replace(/\\n/g, " ").replace(/\\(.)/g, "$1").replace(/\s+/g, " ").trim();
}

/** The readable text of a `Text("...")` / `RawText("...")` source line, or undefined for any other line. */
export function textOfLine(line: string): string | undefined {
  const match = TEXT_STATEMENT.exec(line);
  return match ? readableText(match[1]) : undefined;
}

/** A query in the same shape as `readableText`, so whitespace in the query matches a line break in the text. */
export function normalizeTextQuery(query: string): string {
  return query.replace(/\s+/g, " ").trim();
}
