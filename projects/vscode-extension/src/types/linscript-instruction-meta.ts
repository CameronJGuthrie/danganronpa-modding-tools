import type { LinscriptInstructionName } from "linscript-definitions";
import type { ThemableDecorationAttachmentRenderOptions } from "vscode";
import type { ArgumentNameSource, ArgumentNames, DependentNames } from "../util/string-util";

export type LinscriptInstructionMeta<Parameters extends readonly ParameterMeta[] = ParameterMeta[]> = {
  name: LinscriptInstructionName;
  // TODO: add a description to each opcode meta
  hexcode: string;
  /** Source-only sugar that the compiler expands into the opcode whose hexcode this shares. */
  sugar?: true;
  selfDescribing?: boolean;
  description?: string;
  varargs?: boolean;
  /**
   * For varargs instructions: name tables for the leading arguments and for each repeated group
   * after them, mirroring the compiler's `repeat` layout so names in source resolve to numbers.
   */
  varargNames?: { head: readonly ArgumentNameSource[]; tail: readonly ArgumentNameSource[] };
  parameters: Parameters;
  decorations?: (
    args: {
      [K in keyof Parameters]: number;
    },
    documentText: string,
  ) => string | ThemableDecorationAttachmentRenderOptions[];
};

export type ParameterMetaValue =
  | string
  | {
      name: string;
      description?: string;
    };

export type ParameterMeta = {
  /**
   * The name of the parameter.
   */
  name?: string;
  /**
   * Other data to keep that won't appear in the editor as a decoration
   */
  description?: string;
  /**
   * Whether this parameter is understood
   */
  unknown?: true;
  /**
   * Enum whose member names may appear in source instead of the number, e.g. `Character` lets the
   * decompiler write `Speaker(Makoto)`. The decorator resolves such names back to their value.
   */
  names?: ArgumentNames;
  /**
   * Name table chosen by the value of another argument: `argument` is relative (-1 is the previous
   * argument) and `tables` is keyed by that argument's value. Used where a slot's meaning depends
   * on context, e.g. SetFlag's offset is a character id only for the character flag groups.
   */
  namesBy?: DependentNames;
  /**
   * Map of numbers to LinscriptValue, can be a simple string but might also indicate typing for other params
   */
  values?: { [key: number]: ParameterMetaValue };
};
