import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { log, logError } from "../../output";
import { createCompleteFunctionRegex, getArgumentsFromFunctionLike, isInsideQuotes } from "../../util/string-util";
import { getAudioPlayerManager } from "./audio-player-manager";
import type { AudioTestConfig } from "./test-controller-config";

const LINSCRIPT_GLOB = "**/*.linscript";
const EXCLUDE_GLOB = "{**/node_modules/**,**/.vscode-test/**,**/out/**}";

/**
 * Create and register an audio test controller with the given configuration.
 *
 * Discovery scans every `.linscript` in the workspace on activation and registers a file item
 * only for files that contain at least one call to this controller's opcode. Open editors are
 * re-parsed on every edit so their entries stay live, and a file watcher tracks the rest.
 */
export function createAudioTestController<TInfo>(
  context: vscode.ExtensionContext,
  config: AudioTestConfig<TInfo>,
): vscode.TestController {
  const testController = vscode.tests.createTestController(config.controllerId, config.controllerLabel);
  const audioPlayer = getAudioPlayerManager(context);

  context.subscriptions.push(testController);

  // -------------------------------------------------------------------------
  // File items
  // -------------------------------------------------------------------------

  const isLinscriptFile = (uri: vscode.Uri) => uri.scheme === "file" && uri.fsPath.endsWith(".linscript");

  /**
   * Parse `text` for this controller's opcodes. A file with matches gets (or keeps) a file item
   * holding one child per call; a file without matches is removed from the tree entirely.
   */
  const parseTests = (uri: vscode.Uri, text: string) => {
    const id = uri.toString();
    const children: vscode.TestItem[] = [];
    const lineStarts = computeLineStarts(text);

    for (const pattern of config.functionPatterns) {
      const regex = createCompleteFunctionRegex(pattern.name, pattern.paramCount);
      children.push(...collectMatches(regex, text, lineStarts, uri, testController, config, pattern.paramCount));
    }

    if (children.length === 0) {
      testController.items.delete(id);
      return;
    }

    let fileItem = testController.items.get(id);
    if (!fileItem) {
      fileItem = testController.createTestItem(id, path.basename(uri.fsPath), uri);
      testController.items.add(fileItem);
    }
    fileItem.children.replace(children);
  };

  const isOpen = (uri: vscode.Uri) =>
    vscode.workspace.textDocuments.some((doc) => doc.uri.toString() === uri.toString());

  /** Parse a file from disk. Open documents are skipped because the editor events already cover them. */
  const parseFileFromDisk = async (uri: vscode.Uri) => {
    if (isOpen(uri)) {
      return;
    }
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      parseTests(uri, Buffer.from(bytes).toString("utf8"));
    } catch (error) {
      logError(`Could not read ${uri.fsPath}: ${error}`);
    }
  };

  /** Scan every linscript in the workspace and register the ones that contain this opcode. */
  const discoverWorkspaceFiles = async () => {
    const uris = await vscode.workspace.findFiles(LINSCRIPT_GLOB, EXCLUDE_GLOB);
    await Promise.all(uris.map(parseFileFromDisk));
    log(
      `${config.controllerLabel}: scanned ${uris.length} linscript files, ${testController.items.size} contain tests`,
    );
  };

  // -------------------------------------------------------------------------
  // Keep open editors live
  // -------------------------------------------------------------------------

  const parseDocument = (document: vscode.TextDocument) => {
    if (document.languageId !== "linscript" || !isLinscriptFile(document.uri)) {
      return;
    }
    parseTests(document.uri, document.getText());
  };

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(parseDocument),
    vscode.workspace.onDidChangeTextDocument((e) => parseDocument(e.document)),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        parseDocument(editor.document);
      }
    }),
  );

  vscode.workspace.textDocuments.forEach(parseDocument);

  // -------------------------------------------------------------------------
  // Track files created, deleted, or changed outside the editor
  // -------------------------------------------------------------------------

  const watcher = vscode.workspace.createFileSystemWatcher(LINSCRIPT_GLOB);
  context.subscriptions.push(
    watcher,
    watcher.onDidCreate((uri) => void parseFileFromDisk(uri)),
    watcher.onDidChange((uri) => void parseFileFromDisk(uri)),
    watcher.onDidDelete((uri) => testController.items.delete(uri.toString())),
  );

  void discoverWorkspaceFiles();

  // -------------------------------------------------------------------------
  // Run profile
  // -------------------------------------------------------------------------

  const runProfile = testController.createRunProfile(
    config.runProfileLabel,
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      const run = testController.createTestRun(request);

      const requested = request.include ?? [...collectFileItems(testController)];

      for (const requestedItem of requested) {
        if (token.isCancellationRequested) {
          break;
        }

        for (const test of leafTests(requestedItem)) {
          if (token.isCancellationRequested) {
            break;
          }
          await runTest(test, run);
        }
      }

      run.end();
    },
  );

  context.subscriptions.push(runProfile);

  const runTest = async (test: vscode.TestItem, run: vscode.TestRun) => {
    run.started(test);

    const info = config.parseInfoFromTest(test);
    if (!info) {
      run.errored(test, new vscode.TestMessage("Could not parse info"));
      return;
    }

    if (config.isStopRequest?.(info)) {
      const stopped = audioPlayer.stop(config.channel);
      log(`${config.channel} stop requested; ${stopped ? "stopped playback" : "nothing was playing"}`);
      vscode.window.showInformationMessage(`⏹ ${config.channel} stopped`);
      run.passed(test);
      return;
    }

    log(`Playing ${config.controllerLabel}: ${JSON.stringify(info)}`);

    const audioPath = config.getAudioFilePath(info);
    if (!audioPath) {
      run.errored(test, new vscode.TestMessage("Could not determine audio file path"));
      return;
    }

    if (!fs.existsSync(audioPath)) {
      run.errored(test, new vscode.TestMessage(`Audio file not found: ${audioPath}`));
      return;
    }

    vscode.window.showInformationMessage(config.formatDisplayName(info));

    try {
      audioPlayer.play(config.channel, audioPath);
      run.passed(test);
    } catch (error) {
      run.errored(test, new vscode.TestMessage(`Error playing audio: ${error}`));
      log(`Error playing audio: ${error}`);
    }
  };

  log(`${config.controllerLabel} Test Controller registered`);

  return testController;
}

/** Top-level items are one per file. */
function collectFileItems(testController: vscode.TestController): vscode.TestItem[] {
  const items: vscode.TestItem[] = [];
  testController.items.forEach((item) => items.push(item));
  return items;
}

/** A file item stands for all of its tests. */
function leafTests(item: vscode.TestItem): vscode.TestItem[] {
  if (item.parent) {
    return [item];
  }
  const leaves: vscode.TestItem[] = [];
  item.children.forEach((child) => leaves.push(child));
  return leaves;
}

/** Offsets at which each line begins, so a match offset can be turned into a line number without a TextDocument. */
function computeLineStarts(text: string): number[] {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      starts.push(i + 1);
    }
  }
  return starts;
}

function lineAt(lineStarts: number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= offset) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

/**
 * Build a test item for every match of `regex` in `text` that is a real call (not inside a string).
 */
function collectMatches<TInfo>(
  regex: RegExp,
  text: string,
  lineStarts: number[],
  uri: vscode.Uri,
  testController: vscode.TestController,
  config: AudioTestConfig<TInfo>,
  expectedParamCount: number,
): vscode.TestItem[] {
  const items: vscode.TestItem[] = [];

  for (const match of text.matchAll(regex)) {
    const matchIndex = match.index!;

    if (isInsideQuotes(text, matchIndex)) {
      continue;
    }

    const args = getArgumentsFromFunctionLike(match[0]);
    if (args.length !== expectedParamCount) {
      continue;
    }

    const info = config.parseInfoFromArgs(args);
    if (!info) {
      continue;
    }

    const line = lineAt(lineStarts, matchIndex);
    const column = matchIndex - lineStarts[line];
    const testId = config.createTestId(uri.toString(), line, args);
    const testItem = testController.createTestItem(testId, config.formatTestLabel(info, args), uri);
    testItem.range = new vscode.Range(line, column, line, column + match[0].length);

    items.push(testItem);
  }

  return items;
}
