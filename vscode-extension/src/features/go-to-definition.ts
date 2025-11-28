import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { log } from "../output";
import { findRootDirectory } from "./workspace";

/**
 * Provides "Go to Definition" (Ctrl+Click) functionality for .linscript files
 *
 * Features:
 * - Click on Goto(500) to jump to SetLabel(500)
 * - Click on LoadScript(chapter, episode, scene) to open that script file
 * - Click on RunScript(chapter, episode, scene) to open that script file
 */
export class LinscriptDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const line = document.lineAt(position);
    const lineText = line.text.trim();

    // Get the word range at the cursor position
    const wordRange = document.getWordRangeAtPosition(position, /\w+/);
    const word = wordRange ? document.getText(wordRange) : "";

    // Check if we're on a Goto line
    const gotoMatch = lineText.match(/^Goto\((\d+)\)/);
    if (gotoMatch && (word === "Goto" || lineText.startsWith("Goto"))) {
      const label = gotoMatch[1];
      return this.findLabel(document, label);
    }

    // Check if we're on a LoadScript line
    const loadScriptMatch = lineText.match(/^LoadScript\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (loadScriptMatch && (word === "LoadScript" || lineText.startsWith("LoadScript"))) {
      const chapter = parseInt(loadScriptMatch[1], 10);
      const episode = parseInt(loadScriptMatch[2], 10);
      const scene = parseInt(loadScriptMatch[3], 10);
      log(`LoadScript detected: ${chapter}, ${episode}, ${scene}`);
      return this.findScriptFile(chapter, episode, scene);
    }

    // Check if we're on a RunScript line
    const runScriptMatch = lineText.match(/^RunScript\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (runScriptMatch && (word === "RunScript" || lineText.startsWith("RunScript"))) {
      const chapter = parseInt(runScriptMatch[1], 10);
      const episode = parseInt(runScriptMatch[2], 10);
      const scene = parseInt(runScriptMatch[3], 10);
      log(`RunScript detected: ${chapter}, ${episode}, ${scene}`);
      return this.findScriptFile(chapter, episode, scene);
    }

    return null;
  }

  /**
   * Find the Label that corresponds to a Goto
   */
  private findLabel(document: vscode.TextDocument, label: string): vscode.Location | null {
    const pattern = new RegExp(`^Label\\(${label}\\)`);

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (pattern.test(line.text)) {
        return new vscode.Location(document.uri, new vscode.Position(i, 0));
      }
    }

    return null;
  }

  /**
   * Find the script file based on chapter, episode, and scene numbers
   * Format: e{chapter:02d}_{episode:03d}_{scene:03d}.linscript
   */
  private findScriptFile(chapter: number, episode: number, scene: number): vscode.Location | null {
    const rootDir = findRootDirectory();
    if (!rootDir) {
      log("Root directory not found");
      return null;
    }

    // Format the filename
    const filename = `e${chapter.toString().padStart(2, "0")}_${episode
      .toString()
      .padStart(3, "0")}_${scene.toString().padStart(3, "0")}.linscript`;

    log(`Looking for: ${filename}`);
    log(`Root dir: ${rootDir}`);

    // Search in the mod directory
    const modPath = path.join(rootDir, "mod/dr1_data_us/Dr1/data/us/script", filename);

    log(`Checking mod path: ${modPath}`);
    if (fs.existsSync(modPath)) {
      log(`Found in mod!`);
      return new vscode.Location(vscode.Uri.file(modPath), new vscode.Position(0, 0));
    }

    // If not found in mod, search in linscript-exploration
    const explorationPath = path.join(rootDir, "linscript-exploration", filename);

    log(`Checking exploration path: ${explorationPath}`);
    if (fs.existsSync(explorationPath)) {
      log(`Found in exploration!`);
      return new vscode.Location(vscode.Uri.file(explorationPath), new vscode.Position(0, 0));
    }

    log(`File not found`);
    return null;
  }
}

/**
 * Register the definition provider for .linscript files
 */
export function registerDefinitionProvider(context: vscode.ExtensionContext) {
  const provider = new LinscriptDefinitionProvider();

  const disposable = vscode.languages.registerDefinitionProvider({ scheme: "file", language: "linscript" }, provider);

  context.subscriptions.push(disposable);
}
