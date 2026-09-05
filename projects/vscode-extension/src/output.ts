import * as vscode from "vscode";

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Initialize the output channel for the extension
 */
export function initializeOutputChannel(context: vscode.ExtensionContext): vscode.OutputChannel {
  outputChannel = vscode.window.createOutputChannel("Danganronpa Modding");
  context.subscriptions.push(outputChannel);
  return outputChannel;
}

/**
 * Get the output channel instance
 */
export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    throw new Error("Output channel not initialized. Call initializeOutputChannel first.");
  }
  return outputChannel;
}

/**
 * Log a message to the output channel
 */
export function log(message: string): void {
  getOutputChannel().appendLine(`[INFO] ${message}`);
}

/**
 * Log an error to the output channel
 */
export function logError(message: string): void {
  getOutputChannel().appendLine(`[ERROR] ${message}`);
}

/**
 * Log a warning to the output channel
 */
export function logWarning(message: string): void {
  getOutputChannel().appendLine(`[WARNING] ${message}`);
}

/**
 * Log debug information to the output channel
 */
export function logDebug(message: string): void {
  getOutputChannel().appendLine(`[DEBUG] ${message}`);
}

/**
 * Show the output channel to the user
 */
export function showOutput(preserveFocus: boolean = true): void {
  getOutputChannel().show(preserveFocus);
}

/**
 * Clear the output channel
 */
export function clearOutput(): void {
  getOutputChannel().clear();
}
