import * as vscode from "vscode";
import { registerMusicTestController } from "./features/audio/controllers/music-test-controller";
import { registerSoundTestController } from "./features/audio/controllers/sound-test-controller";
import { registerSoundBTestController } from "./features/audio/controllers/soundb-test-controller";
import { registerVoiceTestController } from "./features/audio/controllers/voice-test-controller";
import { getCompiler } from "./features/compiler";
import { toggleFunctionDecorations, toggleParameterDecorations } from "./features/configuration";
import { registerDecoration } from "./features/decoration";
import { registerDefinitionProvider } from "./features/go-to-definition";
import { registerHoverProvider } from "./features/hover";
import { selectScript, verifyScript } from "./features/scripts";
import { registerWorkbenchRoot, requireWorkbenchRoot } from "./features/workspace";
import { initializeOutputChannel, log, logError } from "./output";

export function activate(context: vscode.ExtensionContext) {
  // Initialize output channel first
  initializeOutputChannel(context);
  const timestamp = new Date().toLocaleTimeString();
  log(`========================================`);
  log(`Danganronpa Modding extension activated at ${timestamp}`);

  registerWorkbenchRoot(context);
  registerDecoration();
  registerDefinitionProvider(context);
  registerHoverProvider(context);
  registerVoiceTestController(context);
  registerSoundTestController(context);
  registerSoundBTestController(context);
  registerMusicTestController(context);

  // Context menu commands: both run the compiler on the worker thread and open the result
  const runScriptCommand = (title: string, run: (root: string, file: string) => Promise<string>) => {
    return async (uri: vscode.Uri) => {
      const rootDir = await requireWorkbenchRoot();
      if (rootDir === null) {
        return;
      }
      try {
        const output = await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title }, () =>
          run(rootDir, uri.fsPath),
        );
        await vscode.window.showTextDocument(vscode.Uri.file(output));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logError(`${title} failed: ${message}`);
        vscode.window.showErrorMessage(`${title} failed: ${message}`);
      }
    };
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "lindecompilerhelper.selectScript",
      runScriptCommand("Select for Modding", (root, file) => selectScript(getCompiler(context), root, file)),
    ),
    vscode.commands.registerCommand(
      "lindecompilerhelper.verifyFile",
      runScriptCommand("Verify File", (root, file) => verifyScript(getCompiler(context), root, file)),
    ),
  );

  // Register toggle commands for decorations
  const toggleParameterDecorationsCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.toggleParameterDecorations",
    toggleParameterDecorations,
  );

  const toggleFunctionDecorationsCommand = vscode.commands.registerCommand(
    "lindecompilerhelper.toggleFunctionDecorations",
    toggleFunctionDecorations,
  );

  context.subscriptions.push(toggleParameterDecorationsCommand);
  context.subscriptions.push(toggleFunctionDecorationsCommand);
}

export function deactivate() {}
