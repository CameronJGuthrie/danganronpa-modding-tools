/**
 * Per-script object names, kept in the `Meta()` block at the bottom of a `.linscript` file:
 *
 *     Meta()
 *       Object(20, Monitor)
 *
 * With a name declared, the body writes `OnObject(Monitor)` and `ObjectState(Monitor, ...)` in
 * place of the id. This module reads the block out of source text and writes an edited set of
 * names back, renaming the body's references to match. Mirrors `opcodes/meta.ts` in lin-compiler.
 */

export type ObjectNames = ReadonlyMap<number, string>;

const META_LINE = /^Meta\s*\(\s*\)$/;
const OBJECT_ENTRY = /^Object\s*\(\s*(\d+)\s*,\s*([A-Za-z_]\w*)\s*\)$/;
/** Instructions whose first argument is an object id. */
const OBJECT_REFERENCE = /^(\s*)(OnObject|ObjectState)\((\s*)([^,)]*?)(\s*)([,)].*)$/;
const IDENTIFIER = /^[A-Za-z_]\w*$/;

/** The block-closing id, which is never an object and never named. */
export const OBJECT_BLOCK_CLOSE = 255;
/** The handler the game runs when the player leaves the area; a fixed id rather than an object. */
export const OBJECT_EXIT = 254;
export const MAX_OBJECT_ID = 254;

export function isValidObjectName(name: string): boolean {
  return IDENTIFIER.test(name);
}

/** Index of the `Meta()` line in `lines`, or -1 when the source has no block. */
function findMetaStart(lines: readonly string[]): number {
  return lines.findIndex((line) => META_LINE.test(line.trim()));
}

/** The object names declared in the source's `Meta()` block. */
export function parseObjectNames(source: string): ObjectNames {
  const lines = source.split("\n");
  const names = new Map<number, string>();
  const start = findMetaStart(lines);
  if (start === -1) {
    return names;
  }
  for (const line of lines.slice(start + 1)) {
    const match = OBJECT_ENTRY.exec(line.trim());
    if (match) {
      names.set(Number(match[1]), match[2]);
    }
  }
  return names;
}

/** The id an object argument denotes, whether written as a number or as a declared name. */
export function resolveObjectId(arg: string, names: ObjectNames): number | undefined {
  const trimmed = arg.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  for (const [id, name] of names) {
    if (name === trimmed) {
      return id;
    }
  }
  return undefined;
}

/**
 * Every object id the body refers to, with how many times, excluding the exit and block-close
 * ids. Lines inside the `Meta()` block are not references.
 */
export function referencedObjectIds(source: string, names: ObjectNames): Map<number, number> {
  const lines = source.split("\n");
  const end = findMetaStart(lines);
  const uses = new Map<number, number>();
  for (const line of end === -1 ? lines : lines.slice(0, end)) {
    const match = OBJECT_REFERENCE.exec(line);
    if (!match) {
      continue;
    }
    const id = resolveObjectId(match[4], names);
    if (id !== undefined && id !== OBJECT_EXIT && id !== OBJECT_BLOCK_CLOSE) {
      uses.set(id, (uses.get(id) ?? 0) + 1);
    }
  }
  return uses;
}

/**
 * Rewrite `source` so its `Meta()` block declares exactly `names`, and every object reference in
 * the body uses the new name for its id (or the plain number when the id has none). An empty set
 * removes the block.
 */
export function applyObjectNames(source: string, names: ObjectNames): string {
  const trailingNewline = source.endsWith("\n");
  const lines = source.split("\n");
  const previous = parseObjectNames(source);
  const metaStart = findMetaStart(lines);
  const body = metaStart === -1 ? [...lines] : lines.slice(0, metaStart);

  const rewritten = body.map((line) => {
    const match = OBJECT_REFERENCE.exec(line);
    if (!match) {
      return line;
    }
    const [, indent, instruction, before, arg, after, rest] = match;
    const id = resolveObjectId(arg, previous);
    if (id === undefined) {
      return line;
    }
    const written = names.get(id) ?? String(id);
    return `${indent}${instruction}(${before}${written}${after}${rest}`;
  });

  while (rewritten.length > 0 && rewritten[rewritten.length - 1].trim() === "") {
    rewritten.pop();
  }
  if (names.size > 0) {
    const ids = [...names.keys()].sort((a, b) => a - b);
    rewritten.push("", "Meta()", ...ids.map((id) => `  Object(${id}, ${names.get(id)})`));
  }
  return rewritten.join("\n") + (trailingNewline ? "\n" : "");
}
