export {};

declare module "tga";

declare global {
  interface Window {
    electron: {
      tgaFileToPng: (filePath: string) => Promise<string>;
      loadFile: (filePath: string, encoding?: BufferEncoding) => Promise<string>;
      openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      openDirectoryDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      getDefaultGameDirectory: () => Promise<string | null>;
      /** The repository's `workbench/linscript-exploration`, or null when it has not been generated. */
      getDefaultScriptDirectory: () => Promise<string | null>;
      /** Every `.linscript` under `directory`, as forward-slash paths relative to it, sorted. */
      listScriptFiles: (directory: string) => Promise<string[]>;
      /**
       * Write `source` back to `filePath` (unless it is read-only) and copy it into the mod script
       * directory. Resolves with the paths written and the read-only original, if it was skipped.
       */
      saveScript: (filePath: string, source: string) => Promise<{ written: string[]; readOnly?: string }>;
      /** Basenames of the `.linscript` files in the mod script directory, i.e. the modified scripts. */
      listModifiedScripts: () => Promise<string[]>;
      /** Read a script for editing, preferring its copy in the mod script directory when one exists. */
      loadScript: (filePath: string) => Promise<{ path: string; source: string; fromMod: boolean }>;
    };
  }
}
