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

/**
 * Insert a blank line so that it becomes line `lineNumber` (1-based), pushing that line and
 * everything after it down. The new line takes the deeper indentation of its two neighbours, so a
 * line added just inside a block opener or just before a block's end stays part of that block.
 */
export function insertBlankLine(source: string, lineNumber: number): string {
  const lines = source.split("\n");
  const index = Math.min(Math.max(lineNumber - 1, 0), lines.length);
  const before = index > 0 ? indentation(lines[index - 1]) : "";
  const after = index < lines.length ? indentation(lines[index]) : "";
  lines.splice(index, 0, before.length >= after.length ? before : after);
  return lines.join("\n");
}

/** Number of lines in `source`, counted the same way `replaceLine` does. */
export function lineCount(source: string): number {
  return source.split("\n").length;
}

function indentation(line: string): string {
  return line.slice(0, line.length - line.trimStart().length);
}

/**
 * Script source together with a stable id per line. Ids survive edits and insertions, so the UI
 * can key rows by identity: inserting a line then only adds one row instead of rebuilding every
 * row below it.
 */
export type ScriptDocument = {
  source: string;
  /** One id per line of `source`, in order. */
  lineIds: readonly number[];
};

let nextLineId = 1;

export function createDocument(source: string): ScriptDocument {
  return { source, lineIds: Array.from({ length: lineCount(source) }, () => nextLineId++) };
}

/** `replaceLine` for a document; ids are unchanged. */
export function replaceDocumentLine(document: ScriptDocument, lineNumber: number, text: string): ScriptDocument {
  return { ...document, source: replaceLine(document.source, lineNumber, text) };
}

/** `insertBlankLine` for a document; the new line gets a fresh id. */
export function insertDocumentBlankLine(document: ScriptDocument, lineNumber: number): ScriptDocument {
  const source = insertBlankLine(document.source, lineNumber);
  if (lineCount(source) === document.lineIds.length) {
    return document;
  }
  const index = Math.min(Math.max(lineNumber - 1, 0), document.lineIds.length);
  const lineIds = [...document.lineIds];
  lineIds.splice(index, 0, nextLineId++);
  return { source, lineIds };
}

/**
 * Replace the whole source, e.g. after rewriting the `Meta()` block. Lines keep their ids by
 * position, so rows above an edit that only changes the bottom of the file are not rebuilt.
 */
export function replaceDocumentSource(document: ScriptDocument, source: string): ScriptDocument {
  const count = lineCount(source);
  const lineIds = document.lineIds.slice(0, count);
  while (lineIds.length < count) {
    lineIds.push(nextLineId++);
  }
  return { source, lineIds };
}
