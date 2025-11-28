import * as vscode from "vscode";

import { registerDecoration } from "./features/decoration";
import { findRootDirectory, isRootWorkspace } from "./features/workspace";
import { initializeOutputChannel, log, logWarning } from "./output";
import { registerVoiceTestController } from "./features/audio/controllers/voice-test-controller";
import { registerSoundTestController } from "./features/audio/controllers/sound-test-controller";
import { registerSoundBTestController } from "./features/audio/controllers/soundb-test-controller";
import { registerMusicTestController } from "./features/audio/controllers/music-test-controller";
import { registerDefinitionProvider } from "./features/go-to-definition";
import { toggleParameterDecorations, toggleFunctionDecorations } from "./features/configuration";

export function activate(context: vscode.ExtensionContext) {
  // Initialize output channel first
  initializeOutputChannel(context);
  const timestamp = new Date().toLocaleTimeString();
  log(`========================================`);
  log(`Danganronpa Modding extension activated at ${timestamp}`);

  if (isRootWorkspace()) {
    log("Root workspace detected");
  } else {
    logWarning(
      ".danganronpa-working-root marker file not found."
    );
    vscode.window.showInformationMessage(
      "Danganronpa extension: .danganronpa-working-root marker file not found in workspace hierarchy. Create this file in your working directory."
    );
  }
  registerDecoration();
  registerDefinitionProvider(context);
  registerVoiceTestController(context);
  registerSoundTestController(context);
  registerSoundBTestController(context);
  registerMusicTestController(context);

  // Register context menu command for selecting scripts
  const selectCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.selectScript",
    async (uri: vscode.Uri) => {
      const rootDir = findRootDirectory();
      if (!rootDir) {
        vscode.window.showErrorMessage("Cannot find root directory with .danganronpa-working-root marker");
        return;
      }

      const path = require("path");
      const fs = require("fs");

      // Determine output file path
      const ext = path.extname(uri.fsPath);
      const basename = path.basename(uri.fsPath, ext);
      const outputPath = path.join(rootDir, "workspace/mod/dr1_data_us/Dr1/data/us/script", `${basename}.linscript`);

      // Run the select command
      const terminal = vscode.window.createTerminal({
        name: "Select Script",
        cwd: rootDir,
      });
      terminal.sendText(`pnpm select ${uri.fsPath}`);
      terminal.show();

      // Wait for the file to be created, then open it
      const checkInterval = setInterval(() => {
        if (fs.existsSync(outputPath)) {
          clearInterval(checkInterval);
          vscode.window.showTextDocument(vscode.Uri.file(outputPath));
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    }
  );

  context.subscriptions.push(selectCommand);

  // Register context menu command for verifying files
  const verifyCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.verifyFile",
    async (uri: vscode.Uri) => {
      const rootDir = findRootDirectory();
      if (!rootDir) {
        vscode.window.showErrorMessage("Cannot find root directory with .danganronpa-working-root marker");
        return;
      }

      const path = require("path");
      const fs = require("fs");

      // Extract the base filename
      const basename = path.basename(uri.fsPath, '.lin');
      const outputPath = path.join(rootDir, "workspace/modded/verify", `${basename}.linscript`);

      // Run the verify command
      const terminal = vscode.window.createTerminal({
        name: "Verify File",
        cwd: rootDir,
      });
      terminal.sendText(`pnpm verify ${uri.fsPath}`);
      terminal.show();

      // Wait for the file to be created, then open it
      const checkInterval = setInterval(() => {
        if (fs.existsSync(outputPath)) {
          clearInterval(checkInterval);
          vscode.window.showTextDocument(vscode.Uri.file(outputPath));
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    }
  );

  context.subscriptions.push(verifyCommand);

  // Register toggle commands for decorations
  const toggleParameterDecorationsCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.toggleParameterDecorations",
    toggleParameterDecorations
  );

  const toggleFunctionDecorationsCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.toggleFunctionDecorations",
    toggleFunctionDecorations
  );

  context.subscriptions.push(toggleParameterDecorationsCommand);
  context.subscriptions.push(toggleFunctionDecorationsCommand);
}

export function deactivate() { }
