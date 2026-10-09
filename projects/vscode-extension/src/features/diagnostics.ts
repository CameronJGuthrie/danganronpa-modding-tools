import * as vscode from "vscode";
import { instructions } from "../instructions";
import { logError } from "../output";
import { scopedNamesFromDocument } from "../util/script-meta";
import { createLooseCallRegex, createQuoteChecker } from "../util/string-util";
import { type ArgumentProblem, validateCall, validateCallSyntax } from "../util/validate-arguments";

/** How long typing must pause before a document is re-validated. */
const TYPING_DEBOUNCE_MS = 300;

/**
 * Reports the problems of every open `.linscript` file to the Problems tab: malformed calls as
 * errors (negative or non-numeric arguments, wrong argument counts; see `validateCallSyntax`) and
 * unrecognised values as warnings (names not in the slot's table, numbers outside the parameter's
 * declared `range`; see `validateCall`). Every open document is checked, not only the active editor, and a document is
 * re-checked when it changes (debounced) and cleared when it closes.
 */
export function registerDiagnostics(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection("linscript");
  const pending = new Map<string, ReturnType<typeof setTimeout>>();

  const validate = (document: vscode.TextDocument) => {
    if (document.languageId !== "linscript") {
      return;
    }
    collection.set(document.uri, computeDiagnostics(document));
  };

  const cancel = (document: vscode.TextDocument) => {
    const key = document.uri.toString();
    const timer = pending.get(key);
    if (timer !== undefined) {
      clearTimeout(timer);
      pending.delete(key);
    }
  };

  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(validate),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId !== "linscript") {
        return;
      }
      cancel(event.document);
      const key = event.document.uri.toString();
      pending.set(
        key,
        setTimeout(() => {
          pending.delete(key);
          validate(event.document);
        }, TYPING_DEBOUNCE_MS),
      );
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      cancel(document);
      collection.delete(document.uri);
    }),
    { dispose: () => pending.forEach((timer) => clearTimeout(timer)) },
  );

  vscode.workspace.textDocuments.forEach(validate);
}

/** Instructions whose arguments include a quoted string, which the call regex cannot delimit. */
const STRING_INSTRUCTIONS: ReadonlySet<string> = new Set(["Text", "TextEager", "RawText", "Option"]);

/** Every problem in `document`, one diagnostic per malformed or unrecognised argument. */
export function computeDiagnostics(document: vscode.TextDocument): vscode.Diagnostic[] {
  const documentText = document.getText();
  const isInsideQuotes = createQuoteChecker(documentText);
  const scopedNames = scopedNamesFromDocument(documentText);
  const diagnostics: vscode.Diagnostic[] = [];

  for (const instruction of Object.values(instructions)) {
    if (STRING_INSTRUCTIONS.has(instruction.name)) {
      continue;
    }
    const regex = createLooseCallRegex(instruction.name);
    try {
      for (const match of documentText.matchAll(regex)) {
        if (isInsideQuotes(match.index)) {
          continue;
        }
        // Values are only looked at once the call is well formed
        const syntax = validateCallSyntax(instruction, match[0]);
        const problems = syntax.length > 0 ? syntax : validateCall(instruction, match[0], scopedNames);
        for (const problem of problems) {
          diagnostics.push(toDiagnostic(document, match.index, problem));
        }
      }
    } catch (error) {
      logError(`Failed to validate ${instruction.name} calls: ${(error as Error).message}`);
    }
  }

  return diagnostics;
}

function toDiagnostic(document: vscode.TextDocument, callIndex: number, problem: ArgumentProblem): vscode.Diagnostic {
  const start = document.positionAt(callIndex + problem.stringIndex);
  const end = document.positionAt(callIndex + problem.stringIndex + problem.length);
  const severity = problem.severity === "error" ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
  const diagnostic = new vscode.Diagnostic(new vscode.Range(start, end), problem.message, severity);
  diagnostic.source = "linscript";
  return diagnostic;
}
