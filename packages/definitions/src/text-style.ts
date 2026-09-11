/**
 * Text styles selectable with `<CLT n>` tags inside game text, named for the role the game uses
 * them in rather than their colour. `Evidence`, `Shout` and `Choice` are inferred from the class
 * trial scripts and are not yet verified in game.
 */
export enum TextStyle {
  /** White; what `<CLT>` resets to. */
  Default = 0,
  /** Pink. Selectable answer words shown in brackets, e.g. `[favor]`. */
  Choice = 1,
  /** Yellow. Items, places and interface terms. */
  Keyword = 3,
  /** Cyan. Makoto's inner monologue. */
  Thought = 4,
  /** Class trial only; looks like the highlighted weak point of a statement. */
  Evidence = 9,
  PaleGreen = 10,
  Red = 11,
  /** Green. Tutorial and narrator text (usually `Speaker(Blank)`) and sound effects. */
  System = 23,
  /** Class trial only; short outbursts such as "Stab!". */
  Shout = 26,
}

const textStyle = new Set(Object.values(TextStyle).filter((v) => typeof v === "number"));

export function isTextStyle(style: number): style is TextStyle {
  return textStyle.has(style);
}

/**
 * The tag name written in `.linscript` for each style, e.g. `<thought>...</thought>`.
 * `Default` has no tag: closing a wrapper returns to it.
 */
export const textStyleTags: Readonly<Record<Exclude<TextStyle, TextStyle.Default>, string>> = {
  [TextStyle.Choice]: "choice",
  [TextStyle.Keyword]: "keyword",
  [TextStyle.Thought]: "thought",
  [TextStyle.Evidence]: "evidence",
  [TextStyle.PaleGreen]: "palegreen",
  [TextStyle.Red]: "red",
  [TextStyle.System]: "system",
  [TextStyle.Shout]: "shout",
};

/** Colour names accepted on compile as synonyms for the role tags. Never written by the decompiler. */
export const textStyleAliases: Readonly<Record<string, TextStyle>> = {
  pink: TextStyle.Choice,
  yellow: TextStyle.Keyword,
  cyan: TextStyle.Thought,
  green: TextStyle.System,
};

const tagToStyle = new Map<string, TextStyle>([
  ...Object.entries(textStyleTags).map(([style, tag]) => [tag, Number(style) as TextStyle] as const),
  ...Object.entries(textStyleAliases),
]);

/** The style for a tag name (role or colour alias), or undefined if the name is not a style tag. */
export function textStyleForTag(tag: string): TextStyle | undefined {
  return tagToStyle.get(tag.toLowerCase());
}

/** The tag name for a style, or undefined for `Default` and unknown ids. */
export function textStyleTag(style: number): string | undefined {
  return isTextStyle(style) && style !== TextStyle.Default ? textStyleTags[style] : undefined;
}
