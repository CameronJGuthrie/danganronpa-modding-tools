import * as vscode from "vscode";
import { textStyleColor } from "../data/text-style-data";
import { metadata } from "../metadata";
import { logDebug, logError, logWarning } from "../output";
import type { LinscriptInstructionMeta } from "../types/linscript-instruction-meta";
import { objectNamesFromDocument } from "../util/script-meta";
import {
  createCompleteFunctionRegex,
  createVarargsRegex,
  getArgumentsFromFunctionLike,
  getColorTextMatch,
  getColorTextRegex,
  getTextFunctionRegex,
  isInsideQuotes,
} from "../util/string-util";
import {
  getDecorationAlignmentColumn,
  getShowFunctionDecorations,
  getShowParameterDecorations,
  onConfigurationChange,
} from "./configuration";

// Create a decoration type for the inline hints
const hintDecorationType = vscode.window.createTextEditorDecorationType({
  after: {
    fontStyle: "italic",
    color: "gray",
  },
});

// Create multiple decoration types for function decorations (to support multiple colors at same position)
// We create a pool of decoration types that can be reused
const functionDecorationTypes: vscode.TextEditorDecorationType[] = [];
const MAX_FUNCTION_DECORATION_PARTS = 10; // Support up to 10 parts per function decoration

for (let i = 0; i < MAX_FUNCTION_DECORATION_PARTS; i++) {
  functionDecorationTypes.push(
    vscode.window.createTextEditorDecorationType({
      after: {
        fontStyle: "italic",
        color: "gray",
      },
    }),
  );
}
const highlightDecorationTypeMap: {
  [colorId: number]: vscode.TextEditorDecorationType;
} = Object.fromEntries(
  Object.entries(textStyleColor).map(([colorId, htmlColor]) => {
    return [
      Number(colorId),
      vscode.window.createTextEditorDecorationType({
        borderColor: htmlColor,
        borderWidth: "0px 0px 2px 0px",
        borderStyle: "solid",
      }),
    ];
  }),
);

export function registerDecoration() {
  const updateDecorations = (editor: vscode.TextEditor) => {
    const document = editor.document;

    // Only apply decorations to .linscript files
    if (document.languageId !== "linscript") {
      return;
    }

    // Get configuration settings
    const showParameterDecorations = getShowParameterDecorations();
    const showFunctionDecorations = getShowFunctionDecorations();

    const documentText = document.getText();

    // Add parameter enrichment
    const hintDecorations: vscode.DecorationOptions[] = [];

    // Track decorations for each function decoration type
    const functionDecorationsByType: vscode.DecorationOptions[][] = [];
    for (let i = 0; i < MAX_FUNCTION_DECORATION_PARTS; i++) {
      functionDecorationsByType.push([]);
    }

    Object.values(metadata).forEach((functionDetails) => {
      const completeFunctionRegex = functionDetails.varargs
        ? createVarargsRegex(functionDetails.name)
        : createCompleteFunctionRegex(functionDetails.name, functionDetails.parameters.length);

      const opcodeFunctionRegex = functionDetails.varargs
        ? createVarargsRegex(functionDetails.hexcode)
        : createCompleteFunctionRegex(functionDetails.hexcode, functionDetails.parameters.length);

      // Debug logging for If
      if (functionDetails.name === "If") {
        logDebug(`If regex: /${completeFunctionRegex.source}/`);
        const matches = documentText.match(completeFunctionRegex);
        logDebug(`If matches found: ${matches ? matches.length : 0}`);
        if (matches && matches.length > 0) {
          logDebug(`First match: ${matches[0]}`);
        }
      }

      try {
        enrichParameters(
          completeFunctionRegex,
          documentText,
          functionDetails,
          document,
          hintDecorations,
          functionDecorationsByType,
          showParameterDecorations,
          showFunctionDecorations,
        );
        enrichParameters(
          opcodeFunctionRegex,
          documentText,
          functionDetails,
          document,
          hintDecorations,
          functionDecorationsByType,
          showParameterDecorations,
          showFunctionDecorations,
        );
      } catch (e) {
        logError(
          `Failed to enrich params for function ${functionDetails.name} (${functionDetails.hexcode}), regex: /${opcodeFunctionRegex.source}/, detail: ${(e as Error).message}`,
        );
      }
    });

    // Add text enrichment
    const highlightDecorationsMap: {
      [colorId: number]: vscode.DecorationOptions[];
    } = Object.fromEntries(
      Object.keys(textStyleColor).map((colorId) => {
        return [Number(colorId), []];
      }),
    );

    const textFunctionRegex = getTextFunctionRegex();

    for (const match of documentText.matchAll(textFunctionRegex)) {
      const matchContent = match[0];

      const colorRegex = getColorTextRegex();

      for (const colorMatch of matchContent.matchAll(colorRegex)) {
        const styled = getColorTextMatch(colorMatch);
        if (styled === undefined || styled.text.length === 0) {
          continue;
        }
        const textStart = match.index + colorMatch.index + styled.openTagLength;
        const startPos = document.positionAt(textStart);
        const endPos = document.positionAt(textStart + styled.text.length);

        if (highlightDecorationsMap[styled.styleId]) {
          highlightDecorationsMap[styled.styleId].push({
            range: new vscode.Range(startPos, endPos),
          });
        } else {
          logWarning(`Unknown text style: ${styled.styleId}`);
        }
      }
    }

    Object.entries(highlightDecorationsMap).forEach(([colorId, colorDecorationOptions]) => {
      editor.setDecorations(highlightDecorationTypeMap[Number(colorId)], colorDecorationOptions);
    });

    // Apply parameter hint decorations
    editor.setDecorations(hintDecorationType, hintDecorations);

    // Apply function decorations in order (this preserves multi-color decorations at same position)
    for (let i = 0; i < MAX_FUNCTION_DECORATION_PARTS; i++) {
      editor.setDecorations(functionDecorationTypes[i], functionDecorationsByType[i]);
    }
  };

  // Listen for changes in the active text editor
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      updateDecorations(editor);
    }
  });

  // Listen for changes in the text editor
  vscode.workspace.onDidChangeTextDocument((event) => {
    const editor = vscode.window.activeTextEditor;
    if (editor && event.document === editor.document) {
      updateDecorations(editor);
    }
  });

  // Listen for configuration changes
  onConfigurationChange(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      updateDecorations(editor);
    }
  });

  // Initial decoration update for the active editor
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }
}

/**
 * Name tables per argument position, expanding a varargs head/tail pattern to the actual count.
 * Parameters scoped to the document (object ids) take their table from its `Meta()` block.
 */
function argumentNames(functionDetails: LinscriptInstructionMeta, call: string, documentText: string) {
  const { varargNames } = functionDetails;
  if (!functionDetails.varargs || !varargNames) {
    return functionDetails.parameters.map((parameter) =>
      parameter.scope === "Object" ? objectNamesFromDocument(documentText) : (parameter.namesBy ?? parameter.names),
    );
  }
  const count = getArgumentsFromFunctionLike(call).length;
  const { head, tail } = varargNames;
  return Array.from({ length: count }, (_, i) =>
    i < head.length ? head[i] : tail.length === 0 ? undefined : tail[(i - head.length) % tail.length],
  );
}

function addParameterDecoration(
  param: LinscriptInstructionMeta["parameters"][number],
  rangePos: vscode.Position,
  hintDecorations: vscode.DecorationOptions[],
): number {
  let contentText = "";
  let decorationWidth = 0;

  const border = "";
  if (param.name) {
    contentText = `${param.name}=`;
  }

  if (contentText) {
    decorationWidth = contentText.length;
    hintDecorations.push({
      range: new vscode.Range(rangePos, rangePos),
      renderOptions: {
        after: {
          contentText,
          border,
        },
      },
    });
  }

  return decorationWidth;
}

function enrichParameters(
  regexp: RegExp,
  documentText: string,
  functionDetails: LinscriptInstructionMeta,
  document: vscode.TextDocument,
  hintDecorations: vscode.DecorationOptions[],
  functionDecorationsByType: vscode.DecorationOptions[][],
  showParameterDecorations: boolean,
  showFunctionDecorations: boolean,
) {
  for (const match of documentText.matchAll(regexp)) {
    const matchIndex = match.index!;
    const matchLength = match[0].length;
    const matchEndIndex = matchIndex + matchLength;

    // Skip if this match is inside quotes
    if (isInsideQuotes(documentText, matchIndex)) {
      continue;
    }

    const args = getArgumentsFromFunctionLike(match[0], argumentNames(functionDetails, match[0], documentText));
    const argValues = args.map((arg) => arg.value);

    if (!functionDetails.varargs && args.length !== functionDetails.parameters.length) {
      const lineNumber = document.positionAt(matchIndex).line + 1;
      const matchedText = match[0];
      logError(
        `Line ${lineNumber}: "${matchedText}" - Expected ${functionDetails.parameters.length} args but found ${args.length}`,
      );
      throw new Error(
        `FATAL: function parameters (${functionDetails.parameters.length}) and expected args (${args.length}) differ in length`,
      );
    }

    let totalDecorationWidth = 0;

    // Only add parameter decorations for non-varargs functions when enabled, and not for
    // instructions whose named arguments already describe themselves
    if (!functionDetails.varargs && !functionDetails.selfDescribing && showParameterDecorations) {
      args.forEach(({ stringIndex }, argIndex) => {
        const param = functionDetails.parameters[argIndex];
        const rangePos = document.positionAt(matchIndex + stringIndex);
        const decorationWidth = addParameterDecoration(param, rangePos, hintDecorations);
        totalDecorationWidth += decorationWidth;
      });
    }

    if (showFunctionDecorations) {
      addFunctionDecoration(
        functionDetails,
        argValues,
        documentText,
        matchEndIndex,
        totalDecorationWidth,
        document,
        hintDecorations,
        functionDecorationsByType,
      );
    }
  }
}

function addFunctionDecoration(
  functionDetails: LinscriptInstructionMeta,
  argValues: number[],
  documentText: string,
  matchEndIndex: number,
  totalParameterDecorationWidth: number,
  document: vscode.TextDocument,
  hintDecorations: vscode.DecorationOptions[],
  functionDecorationsByType: vscode.DecorationOptions[][],
) {
  if (!functionDetails.decorations) {
    return;
  }

  const rangePos = document.positionAt(matchEndIndex);
  const functionDecorations = functionDetails.decorations(argValues, documentText);

  // Calculate current visual column: end position + parameter decorations
  const matchEndPos = document.positionAt(matchEndIndex);
  const currentColumn = matchEndPos.character + totalParameterDecorationWidth;

  // Get target column from settings
  const targetColumn = getDecorationAlignmentColumn();

  // Calculate padding needed (ensure at least 1 space)
  // Use non-breaking space (\u00A0) to prevent VSCode from collapsing spaces
  const paddingChars = Math.max(1, targetColumn - currentColumn);
  const padding = "\u00A0".repeat(paddingChars);

  if (typeof functionDecorations === "string") {
    hintDecorations.push({
      range: new vscode.Range(rangePos, rangePos),
      renderOptions: {
        after: {
          contentText: padding + functionDecorations,
        },
      },
    });
  } else {
    // Use separate decoration types for each part to support multiple colors at same position
    // This relies on VSCode preserving the order when using different decoration types
    functionDecorations.forEach((renderOptions, index) => {
      const content = index === 0 ? padding + (renderOptions.contentText || "") : renderOptions.contentText || "";

      if (index < MAX_FUNCTION_DECORATION_PARTS) {
        functionDecorationsByType[index].push({
          range: new vscode.Range(rangePos, rangePos),
          renderOptions: {
            after: {
              ...renderOptions,
              contentText: content,
            },
          },
        });
      } else {
        logWarning(`Function decoration has more than ${MAX_FUNCTION_DECORATION_PARTS} parts, some will be skipped`);
      }
    });
  }
}
