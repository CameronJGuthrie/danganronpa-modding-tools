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
      /**
       * The workbench folder in use: the saved setting (`configured`), or the repository's
       * `workbench/` found next to a development checkout; `path` is null when there is neither.
       */
      getWorkbenchRoot: () => Promise<{ path: string | null; configured: boolean }>;
      /** Pick a workbench folder and save it as the setting; null when the dialog was cancelled. */
      chooseWorkbenchRoot: () => Promise<string | null>;
      /** The workbench's extracted `all/`, which sprite paths are relative to, or null when it has not been extracted. */
      getDefaultAssetDirectory: () => Promise<string | null>;
      /** The workbench's `exploration/`, or null when it has not been generated. */
      getDefaultScriptDirectory: () => Promise<string | null>;
      /** Every `.linscript` under `directory`, as forward-slash paths relative to it, sorted. */
      listScriptFiles: (directory: string) => Promise<string[]>;
      /** Case-insensitive text search of every `.linscript` under `directory`, capped at 500 hits. */
      searchScripts: (
        directory: string,
        query: string,
      ) => Promise<{
        hits: { path: string; lineNumber: number; text: string }[];
        fileCount: number;
        truncated: boolean;
      }>;
      /** Basenames of the `.linscript` files in the mod script directory, i.e. the modified scripts. */
      listModifiedScripts: () => Promise<string[]>;
      /** Read a script for viewing, preferring its copy in the mod script directory when one exists. */
      loadScript: (filePath: string) => Promise<{ path: string; source: string; fromMod: boolean }>;
      /** Build every mod with the repository's build script, then launch the game through Steam. */
      runGame: () => Promise<{ ok: boolean; output: string }>;
    };
  }
}
