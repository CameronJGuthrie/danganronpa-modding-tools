import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { log } from "../output";
import { createStartOfLineFunctionRegex } from "../util/string-util";
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
    const gotoMatch = lineText.match(createStartOfLineFunctionRegex("Goto", 1));
    if (gotoMatch && (word === "Goto" || lineText.startsWith("Goto"))) {
      const label = gotoMatch[1];
      return this.findLabel(document, label);
    }

    // Check if we're on a LoadScript line
    const loadScriptMatch = lineText.match(createStartOfLineFunctionRegex("LoadScript", 3));
    if (loadScriptMatch && (word === "LoadScript" || lineText.startsWith("LoadScript"))) {
      const chapter = parseInt(loadScriptMatch[1], 10);
      const episode = parseInt(loadScriptMatch[2], 10);
      const scene = parseInt(loadScriptMatch[3], 10);
      log(`LoadScript detected: ${chapter}, ${episode}, ${scene}`);
      return this.findScriptFile(chapter, episode, scene);
    }

    // Check if we're on a RunScript line
    const runScriptMatch = lineText.match(createStartOfLineFunctionRegex("RunScript", 3));
    if (runScriptMatch && (word === "RunScript" || lineText.startsWith("RunScript"))) {
      const chapter = parseInt(runScriptMatch[1], 10);
      const episode = parseInt(runScriptMatch[2], 10);
      const scene = parseInt(runScriptMatch[3], 10);
      log(`RunScript detected: ${chapter}, ${episode}, ${scene}`);
      return this.findScriptFile(chapter, episode, scene);
    }

    // Check if we're on a Sprite line
    const runSpriteMatch = lineText.match(createStartOfLineFunctionRegex("Sprite", 5));
    if (runSpriteMatch && (word === "Sprite" || lineText.startsWith("Sprite"))) {
      const character = parseInt(runSpriteMatch[2], 10);
      const spriteId = parseInt(runSpriteMatch[3], 10);
      log(`Sprite detected: ${character}`);
      return this.findSpriteImageFile(character, spriteId);
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

  /**
   * Find the sprite image file based on character and spriteId
   * TODO: when does the Sprite opcode use the bustup images at dr1_data/Dr1/data/all/texture/cg/*.tga
   */
  private findSpriteImageFile(character: number, spriteId: number): vscode.Location | null {
    const rootDir = findRootDirectory();
    if (!rootDir) {
      log("Root directory not found");
      return null;
    }

    // Format the filename
    const filename = `stand_${character.toString().padStart(2, "0")}_${spriteId.toString().padStart(2, "0")}.tga`;

    log(`Looking for: ${filename}`);
    log(`Root dir: ${rootDir}`);

    // Search in the mod directory
    const modPath = path.join(rootDir, "mod/dr1_data/Dr1/data/all/texture", filename);

    log(`Checking mod path: ${modPath}`);
    if (fs.existsSync(modPath)) {
      log(`Found in mod!`);
      return new vscode.Location(vscode.Uri.file(modPath), new vscode.Position(0, 0));
    }

    // Search in the modded directory
    const moddedPath = path.join(rootDir, "modded/dr1_data/Dr1/data/all/texture", filename);

    log(`Checking modded path: ${moddedPath}`);
    if (fs.existsSync(moddedPath)) {
      log(`Found in mod!`);
      return new vscode.Location(vscode.Uri.file(moddedPath), new vscode.Position(0, 0));
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
