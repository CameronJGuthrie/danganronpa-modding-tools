export const ScriptType = {
  Textless: 1,
  Text: 2,
} as const;

export type ScriptType = (typeof ScriptType)[keyof typeof ScriptType];

type ScriptEntryCommon = {
  opcode: number;
  args: number[];
};

type ScriptEntryText = ScriptEntryCommon & {
  text: string;
};

export type ScriptEntry = ScriptEntryCommon | ScriptEntryText;

/**
 * Source-only annotations kept at the bottom of a `.linscript` file in its `Meta()` block. They
 * have no binary form: compiling drops them and decompiling a `.lin` yields none.
 */
export interface ScriptMeta {
  /** Names for this script's object ids, as used by `OnObject` and `ObjectState`. */
  objects: Readonly<Record<number, string>>;
  /** Names for this script's character ids, the placed-character slots `OnCharacter` handles. */
  characters: Readonly<Record<number, string>>;
  /**
   * Names for this script's menu option ids, as used by `SetOption` and `Option`. These are the
   * declared entries only; `DEFAULT_OPTION_NAMES` in `opcodes/meta.ts` applies underneath them.
   */
  options: Readonly<Record<number, string>>;
}

export interface Script {
  entries: ScriptEntry[];
  meta?: ScriptMeta;
}
