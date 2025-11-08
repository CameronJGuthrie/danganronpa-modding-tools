import { app, BrowserWindow, dialog, ipcMain } from "electron";
import started from "electron-squirrel-startup";
import fs from "fs";
import path from "path";

import { loadFile } from "./main/file";
import { convertTgaToPngDataUrl } from "./main/tga";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

ipcMain.handle("choose-directory", async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result;
});

ipcMain.handle("choose-file", async () => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
  });
  return result;
});

ipcMain.handle("load-file", async (_event, filePath: string, encoding?: BufferEncoding) => {
  const result = await loadFile(filePath);

  return result.toString(encoding);
});

ipcMain.handle("get-default-game-directory", () => {
  // Attempt to find the default game directory based on platform
  const commonPaths = [
    // Windows Steam
    "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Danganronpa Trigger Happy Havoc",
    "C:\\Program Files\\Steam\\steamapps\\common\\Danganronpa Trigger Happy Havoc",
    // Linux Steam
    path.join(process.env.HOME || "", ".steam/steam/steamapps/common/Danganronpa Trigger Happy Havoc"),
    path.join(process.env.HOME || "", ".local/share/Steam/steamapps/common/Danganronpa Trigger Happy Havoc"),
    // macOS Steam
    path.join(process.env.HOME || "", "Library/Application Support/Steam/steamapps/common/Danganronpa Trigger Happy Havoc"),
  ];

  for (const dir of commonPaths) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }

  return null;
});

ipcMain.handle("tga-file-to-base-64-png", async (_event, filePath: string) => {
  return convertTgaToPngDataUrl(filePath);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
