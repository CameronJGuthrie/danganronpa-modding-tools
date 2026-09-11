import { textStyleForTag, textStyleTag } from "linscript-definitions";
import { SourceError } from "../errors.ts";

/**
 * Source sugar for the `<CLT n>` / `<CLT>` style tags inside game text.
 *
 * The engine treats every tag as "switch to style n" (`<CLT>` is "switch to Default"); there is no
 * stack. Source offers two forms on top of that:
 *
 * - **Role wrappers** `<thought>...</thought>`: the readable form. A close tag switches back to the
 *   enclosing wrapper's style, or to Default when none is open, so authored nesting means what it
 *   looks like. An unclosed wrapper at the end of the text switches nothing back.
 * - **Flat switches** `<style 4>...<style 0>`: mirror the engine exactly. The decompiler only uses
 *   them when wrappers cannot reproduce the bytes (doubled tags, resets with nothing open, unknown
 *   style ids).
 *
 * `<CLT ...>` tags in source are passed through verbatim, as is any `<word>` that is not a style tag.
 */

const RAW_TAG = /<CLT\s+(\d+)>|<CLT>/g;
const HAS_RAW_TAG = /<CLT(?:\s+\d+)?>/;
const SOURCE_TAG = /<(\/?)([A-Za-z][A-Za-z0-9]*)>|<style\s+(\d+)>|<CLT(?:\s+\d+)?>/g;

const DEFAULT_STYLE = 0;

/** Render raw game text (with `<CLT>` tags) in the sugared source form. */
export function formatStyledText(raw: string): string {
  if (!HAS_RAW_TAG.test(raw)) {
    return raw;
  }
  const wrapped = tryWrappers(raw);
  if (wrapped !== undefined && compilesTo(wrapped, raw)) {
    return wrapped;
  }
  return raw.replace(RAW_TAG, (_, style: string | undefined) => `<style ${style ?? DEFAULT_STYLE}>`);
}

function compilesTo(source: string, raw: string): boolean {
  try {
    return parseStyledText(source) === raw;
  } catch {
    return false;
  }
}

/** Greedy wrapper rendering; the caller verifies it compiles back to the same bytes. */
function tryWrappers(raw: string): string | undefined {
  const stack: number[] = [];
  let out = "";
  let last = 0;

  for (const match of raw.matchAll(RAW_TAG)) {
    out += raw.slice(last, match.index);
    last = match.index + match[0].length;

    if (match[1] === undefined) {
      // <CLT>: close the innermost wrapper. With nothing open there is nothing to close.
      const style = stack.pop();
      if (style === undefined) {
        return undefined;
      }
      out += `</${textStyleTag(style)}>`;
      continue;
    }

    const style = Number(match[1]);
    if (style === DEFAULT_STYLE || textStyleTag(style) === undefined) {
      return undefined;
    }
    // Switching back to the enclosing style is how nesting closes in the engine
    if (stack.length >= 2 && stack[stack.length - 2] === style) {
      out += `</${textStyleTag(stack.pop() as number)}>`;
      continue;
    }
    stack.push(style);
    out += `<${textStyleTag(style)}>`;
  }

  return out + raw.slice(last);
}

/** Compile sugared source text back into raw game text with `<CLT>` tags. */
export function parseStyledText(source: string, line?: number): string {
  const stack: number[] = [];
  return source.replace(
    SOURCE_TAG,
    (tag, slash: string | undefined, name: string | undefined, flat: string | undefined) => {
      if (flat !== undefined) {
        return clt(Number(flat));
      }
      if (name === undefined) {
        return tag; // raw <CLT ...> passes through
      }
      const style = textStyleForTag(name);
      if (style === undefined) {
        return tag; // not a style tag (e.g. an emoticon); leave the text alone
      }
      if (slash === "") {
        stack.push(style);
        return clt(style);
      }
      const open = stack.pop();
      if (open !== style) {
        const expected = open === undefined ? "no open tag" : `</${textStyleTag(open)}>`;
        throw new SourceError(line ?? 0, `unexpected ${tag}; expected ${expected}`);
      }
      return clt(stack.length === 0 ? DEFAULT_STYLE : stack[stack.length - 1]);
    },
  );
}

function clt(style: number): string {
  return style === DEFAULT_STYLE ? "<CLT>" : `<CLT ${style}>`;
}
