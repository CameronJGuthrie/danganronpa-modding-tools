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
    };
  }
}
