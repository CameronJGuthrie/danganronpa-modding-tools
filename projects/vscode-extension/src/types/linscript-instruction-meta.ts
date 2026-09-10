import type { LinscriptInstructionName } from "linscript-definitions";
import type { ThemableDecorationAttachmentRenderOptions } from "vscode";
import type { ArgumentNames } from "../util/string-util";

export type LinscriptInstructionMeta<Parameters extends readonly ParameterMeta[] = ParameterMeta[]> = {
  name: LinscriptInstructionName;
  // TODO: add a description to each opcode meta
  hexcode: string;
  description?: string;
  varargs?: boolean;
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
   * Map of numbers to LinscriptValue, can be a simple string but might also indicate typing for other params
   */
  values?: { [key: number]: ParameterMetaValue };
};
