import * as vscode from "vscode";

const EXTENSION_ID = "lindecompilerhelper";

/**
 * Configuration keys for the extension
 */
export const ConfigurationKeys = {
  DECORATION_ALIGNMENT_COLUMN: "decorationAlignmentColumn",
  SHOW_PARAMETER_DECORATIONS: "showParameterDecorations",
  SHOW_FUNCTION_DECORATIONS: "showFunctionDecorations",
} as const;

/**
 * Get the extension configuration
 */
function getConfig(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(EXTENSION_ID);
}

/**
 * Get the column at which to align function decorations
 */
export function getDecorationAlignmentColumn(): number {
  return getConfig().get<number>(ConfigurationKeys.DECORATION_ALIGNMENT_COLUMN, 40);
}

/**
 * Get whether to show parameter decorations
 */
export function getShowParameterDecorations(): boolean {
  return getConfig().get<boolean>(ConfigurationKeys.SHOW_PARAMETER_DECORATIONS, true);
}

/**
 * Get whether to show function decorations
 */
export function getShowFunctionDecorations(): boolean {
  return getConfig().get<boolean>(ConfigurationKeys.SHOW_FUNCTION_DECORATIONS, true);
}

/**
 * Toggle parameter decorations on/off
 */
export async function toggleParameterDecorations(): Promise<void> {
  const currentValue = getShowParameterDecorations();
  await getConfig().update(
    ConfigurationKeys.SHOW_PARAMETER_DECORATIONS,
    !currentValue,
    vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(
    `Parameter decorations ${!currentValue ? "enabled" : "disabled"}`
  );
}

/**
 * Toggle function decorations on/off
 */
export async function toggleFunctionDecorations(): Promise<void> {
  const currentValue = getShowFunctionDecorations();
  await getConfig().update(
    ConfigurationKeys.SHOW_FUNCTION_DECORATIONS,
    !currentValue,
    vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(
    `Function decorations ${!currentValue ? "enabled" : "disabled"}`
  );
}

/**
 * Register configuration change listeners
 * @param callback Called when configuration changes
 * @returns Disposable to unregister the listener
 */
export function onConfigurationChange(
  callback: (event: vscode.ConfigurationChangeEvent) => void
): vscode.Disposable {
  return vscode.workspace.onDidChangeConfiguration((event) => {
    if (
      event.affectsConfiguration(`${EXTENSION_ID}.${ConfigurationKeys.SHOW_PARAMETER_DECORATIONS}`) ||
      event.affectsConfiguration(`${EXTENSION_ID}.${ConfigurationKeys.SHOW_FUNCTION_DECORATIONS}`) ||
      event.affectsConfiguration(`${EXTENSION_ID}.${ConfigurationKeys.DECORATION_ALIGNMENT_COLUMN}`)
    ) {
      callback(event);
    }
  });
}
