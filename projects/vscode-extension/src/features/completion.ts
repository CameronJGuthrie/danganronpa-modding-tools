import * as vscode from "vscode";
import { logDebug } from "../output";
import { type Completion, completionsAt, contextAt } from "../util/completions";

/**
 * Context-aware autocomplete for `.linscript` files, built on `util/completions.ts`: instruction
 * names at the start of a statement, and the names an argument slot accepts inside a call (the
 * same tables the decorations, hovers and diagnostics use, including the file's `Meta()` names).
 *
 * The list opens as the user types a word, on `(` and `,` so the first and next argument's names
 * appear at once, and on a space only inside an argument list, so a space after a finished
 * statement does not pop up every instruction.
 */
export class LinscriptCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position.line).text;
    if (context.triggerCharacter === " " && contextAt(lineText, position.character).kind !== "argument") {
      return undefined;
    }
    const result = completionsAt(lineText, position.character, document.getText());
    if (result.items.length === 0) {
      return undefined;
    }
    const range = new vscode.Range(position.line, result.replaceStart, position.line, result.replaceEnd);
    return result.items.map((item, index) => toCompletionItem(item, index, range));
  }
}

function toCompletionItem(item: Completion, index: number, range: vscode.Range): vscode.CompletionItem {
  const kind = item.kind === "instruction" ? vscode.CompletionItemKind.Function : vscode.CompletionItemKind.EnumMember;
  const completion = new vscode.CompletionItem(item.label, kind);
  completion.detail = item.detail;
  completion.documentation =
    item.documentation === undefined ? undefined : new vscode.MarkdownString(item.documentation);
  completion.range = range;
  // Items arrive alphabetically; a zero-padded index keeps that order whatever the editor's own sort would do
  completion.sortText = String(index).padStart(4, "0");
  completion.filterText = item.label;
  if (item.snippet !== undefined) {
    completion.insertText = new vscode.SnippetString(item.snippet);
  }
  if (item.retrigger) {
    completion.command = { command: "editor.action.triggerSuggest", title: "Suggest arguments" };
  }
  return completion;
}

export function registerCompletionProvider(context: vscode.ExtensionContext) {
  const provider = new LinscriptCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider({ language: "linscript" }, provider, "(", ",", " "),
  );
  logDebug("Completion provider registered");
}
