// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  tgaFileToPng: (filePath: string) => ipcRenderer.invoke("tga-file-to-base-64-png", filePath),
  loadFile: (filePath: string, encoding?: BufferEncoding) => ipcRenderer.invoke("load-file", filePath, encoding),
  openFileDialog: () => ipcRenderer.invoke("choose-file"),
  openDirectoryDialog: () => ipcRenderer.invoke("choose-directory"),
  getDefaultGameDirectory: () => ipcRenderer.invoke("get-default-game-directory"),
});
