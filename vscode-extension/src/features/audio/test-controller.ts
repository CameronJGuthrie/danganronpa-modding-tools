import * as vscode from "vscode";
import { log } from "../../output";
import { createCompleteFunctionRegex, getArgumentsFromFunctionLike, isInsideQuotes } from "../../util/string-util";
import { playAudio } from "./play-audio";
import type { AudioTestConfig } from "./test-controller-config";

/**
 * Gather all tests from a test controller
 */
export function gatherAllTests(testController: vscode.TestController): vscode.TestItem[] {
  const tests: vscode.TestItem[] = [];
  testController.items.forEach((item) => {
    tests.push(item);
    item.children.forEach((child) => tests.push(child));
  });
  return tests;
}

/**
 * Create and register an audio test controller with the given configuration
 */
export function createAudioTestController<TInfo>(
  context: vscode.ExtensionContext,
  config: AudioTestConfig<TInfo>,
): vscode.TestController {
  // Create the test controller
  const testController = vscode.tests.createTestController(config.controllerId, config.controllerLabel);

  context.subscriptions.push(testController);

  // Create a run profile for playing audio
  const runProfile = testController.createRunProfile(
    config.runProfileLabel,
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      const run = testController.createTestRun(request);

      // Get the tests to run
      const testsToRun = request.include ?? gatherAllTests(testController);

      for (const test of testsToRun) {
        if (token.isCancellationRequested) {
          break;
        }

        run.started(test);

        // Extract info from the test ID
        const info = config.parseInfoFromTest(test);
        if (info) {
          log(`Playing ${config.controllerLabel}: ${JSON.stringify(info)}`);

          // Get the audio file path
          const audioPath = config.getAudioFilePath(info);

          if (!audioPath) {
            run.errored(test, new vscode.TestMessage("Could not determine audio file path"));
            continue;
          }

          // Check if the file exists
          const fs = require("node:fs");
          if (!fs.existsSync(audioPath)) {
            run.errored(test, new vscode.TestMessage(`Audio file not found: ${audioPath}`));
            continue;
          }

          // Get the display name
          const displayName = config.formatDisplayName(info);

          // Show notification
          vscode.window.showInformationMessage(displayName);

          // Play the audio
          try {
            playAudio(audioPath, config.playerName, config.timeoutMs);
            run.passed(test);
            log(`Successfully played audio: ${audioPath}`);
          } catch (error) {
            run.errored(test, new vscode.TestMessage(`Error playing audio: ${error}`));
            log(`Error playing audio: ${error}`);
          }
        } else {
          run.errored(test, new vscode.TestMessage("Could not parse info"));
        }
      }

      run.end();
    },
  );

  context.subscriptions.push(runProfile);

  // Parse tests in document
  const parseTestsInDocument = (document: vscode.TextDocument) => {
    // Only process linscript files
    if (document.languageId !== "linscript") {
      return;
    }

    log(`Parsing ${config.controllerLabel} tests in ${document.fileName}`);

    const documentText = document.getText();

    // Get or create a test item for this file
    let fileTestItem = testController.items.get(document.uri.toString());
    if (!fileTestItem) {
      fileTestItem = testController.createTestItem(
        document.uri.toString(),
        document.uri.fsPath.split("/").pop() || "Unknown",
        document.uri,
      );
      testController.items.add(fileTestItem);
    }

    // Clear existing children
    fileTestItem.children.replace([]);

    // Process each function pattern
    for (const pattern of config.functionPatterns) {
      const regex = createCompleteFunctionRegex(pattern.name, pattern.paramCount);
      processMatches(regex, documentText, document, fileTestItem, testController, config, pattern.paramCount);
    }

    log(`Found ${fileTestItem.children.size} ${config.controllerLabel} tests in ${document.fileName}`);
  };

  // Watch for document changes to update tests
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(parseTestsInDocument),
    vscode.workspace.onDidChangeTextDocument((e) => parseTestsInDocument(e.document)),
  );

  // Parse tests in all open documents
  vscode.workspace.textDocuments.forEach(parseTestsInDocument);

  // Parse tests when active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        parseTestsInDocument(editor.document);
      }
    }),
  );

  log(`${config.controllerLabel} Test Controller registered`);

  return testController;
}

/**
 * Process matches for a given regex pattern
 */
function processMatches<TInfo>(
  regex: RegExp,
  documentText: string,
  document: vscode.TextDocument,
  fileTestItem: vscode.TestItem,
  testController: vscode.TestController,
  config: AudioTestConfig<TInfo>,
  expectedParamCount: number,
): void {
  let match;
  while ((match = regex.exec(documentText)) !== null) {
    const matchIndex = match.index;

    // Skip if this match is inside quotes
    if (isInsideQuotes(documentText, matchIndex)) {
      continue;
    }

    // Parse the arguments
    const args = getArgumentsFromFunctionLike(match[0]);
    if (args.length !== expectedParamCount) {
      continue;
    }

    // Parse info from arguments
    const info = config.parseInfoFromArgs(args);
    if (!info) {
      continue;
    }

    // Format label
    const label = config.formatTestLabel(info, args);

    // Get the line for this match
    const position = document.positionAt(matchIndex);
    const line = position.line;
    const range = new vscode.Range(line, 0, line, match[0].length);

    // Create a unique test ID
    const testId = config.createTestId(document.uri.toString(), line, args);

    // Create a test item
    const testItem = testController.createTestItem(testId, label, document.uri);

    testItem.range = range;

    // Add to the file's children
    fileTestItem.children.add(testItem);

    log(`Added ${config.controllerLabel} test at line ${line}: ${JSON.stringify(info)}`);
  }
}
