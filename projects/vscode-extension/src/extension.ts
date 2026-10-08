import { mkdir } from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { getAudioPlayerManager } from "./features/audio/audio-player-manager";
import { registerMusicTestController } from "./features/audio/controllers/music-test-controller";
import { registerSoundTestController } from "./features/audio/controllers/sound-test-controller";
import { registerSoundBTestController } from "./features/audio/controllers/soundb-test-controller";
import { registerVoiceTestController } from "./features/audio/controllers/voice-test-controller";
import { getCompiler } from "./features/compiler";
import { registerCompletionProvider } from "./features/completion";
import { toggleFunctionDecorations, toggleParameterDecorations } from "./features/configuration";
import { registerDecoration } from "./features/decoration";
import { registerDiagnostics } from "./features/diagnostics";
import { registerDefinitionProvider } from "./features/go-to-definition";
import { registerHoverProvider } from "./features/hover";
import { listPakEntries, modPakDir, selectPakEntry, selectScript, verifyScript } from "./features/scripts";
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
  registerDiagnostics(context);
  registerDefinitionProvider(context);
  registerHoverProvider(context);
  registerCompletionProvider(context);
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
    vscode.commands.registerCommand("lindecompilerhelper.selectPak", (uri: vscode.Uri) => selectPak(context, uri)),
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

  // Kill every player process the audio controllers have started
  context.subscriptions.push(
    vscode.commands.registerCommand("lindecompilerhelper.stopAudio", () => {
      const stopped = getAudioPlayerManager(context).stopAll();
      log(`Stop All Audio: killed ${stopped} player${stopped === 1 ? "" : "s"}`);
      vscode.window.setStatusBarMessage(
        stopped === 0
          ? "LinScript: no audio playing"
          : `LinScript: stopped ${stopped} audio player${stopped === 1 ? "" : "s"}`,
        3000,
      );
    }),
  );
}

/**
 * "Select PAK for Modding" on an extracted pak folder: pick the entries to author, make a
 * `.linscript` for each in the mod's `pak_<folder>` directory and open the first. The directory
 * is created even when nothing is picked, so entries can be dropped in by hand.
 */
async function selectPak(context: vscode.ExtensionContext, uri: vscode.Uri): Promise<void> {
  const title = "Select PAK for Modding";
  const rootDir = await requireWorkbenchRoot();
  if (rootDir === null) {
    return;
  }
  try {
    const folder = uri.fsPath;
    const targetDir = modPakDir(rootDir, folder);
    const entries = await listPakEntries(folder);
    if (entries.length === 0) {
      vscode.window.showErrorMessage(`${title}: ${path.basename(folder)} has no .lin or .linscript entries`);
      return;
    }
    const picked = await vscode.window.showQuickPick(
      entries.map((entry) => ({ label: path.basename(entry.file), description: `entry ${entry.index}`, entry })),
      { canPickMany: true, title: `${title}: entries of ${path.basename(folder)} to author` },
    );
    if (picked === undefined) {
      return;
    }
    await mkdir(targetDir, { recursive: true });
    const outputs = await vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title }, async () => {
      const compiler = getCompiler(context);
      const results: string[] = [];
      for (const item of picked) {
        results.push(await selectPakEntry(compiler, rootDir, item.entry.file));
      }
      return results;
    });
    if (outputs.length > 0) {
      await vscode.window.showTextDocument(vscode.Uri.file(outputs[0]));
    }
    await vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(outputs[0] ?? targetDir));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logError(`${title} failed: ${message}`);
    vscode.window.showErrorMessage(`${title} failed: ${message}`);
  }
}

export function deactivate() {}
