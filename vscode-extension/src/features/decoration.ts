import * as vscode from "vscode";
import { textStyleColor } from "../data/text-style-data";
import type { OpcodeMeta } from "../types/opcode-meta";
import { metadata } from "../metadata";
import { logDebug, logError, logWarning } from "../output";
import {
  createCompleteFunctionRegex,
  createVarargsRegex,
  getArgumentsFromFunctionLike,
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

    metadata.forEach((functionDetails) => {
      const completeFunctionRegex = functionDetails.varargs
        ? createVarargsRegex(functionDetails.name)
        : createCompleteFunctionRegex(functionDetails.name, functionDetails.parameters.length);

      const opcodeFunctionRegex = functionDetails.varargs
        ? createVarargsRegex(functionDetails.opcode)
        : createCompleteFunctionRegex(functionDetails.opcode, functionDetails.parameters.length);

      // Debug logging for Evaluate
      if (functionDetails.name === "Evaluate") {
        logDebug(`Evaluate regex: /${completeFunctionRegex.source}/`);
        const matches = documentText.match(completeFunctionRegex);
        logDebug(`Evaluate matches found: ${matches ? matches.length : 0}`);
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
          `Failed to enrich params for function ${functionDetails.name} (${functionDetails.opcode}), regex: /${opcodeFunctionRegex.source}/, detail: ${(e as Error).message}`,
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

      const colorMatch = colorRegex.exec(matchContent);
      if (colorMatch?.[1] && colorMatch[2]) {
        const colorId = Number(colorMatch[1]);
        const coloredText = colorMatch[2];

        const startPos = document.positionAt(match.index + colorMatch.index + "<CLT n>".length);
        const endPos = document.positionAt(match.index + colorMatch.index + "<CLT n>".length + coloredText.length);

        if (highlightDecorationsMap[colorId]) {
          highlightDecorationsMap[colorId].push({
            range: new vscode.Range(startPos, endPos),
          });
        } else {
          logWarning(`Unknown color ID: ${colorId}`);
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

function addParameterDecoration(
  param: OpcodeMeta["parameters"][number],
  rangePos: vscode.Position,
  hintDecorations: vscode.DecorationOptions[],
): number {
  let contentText = "";
  let decorationWidth = 0;

  const border = "";
  if (param.unknown) {
    contentText = "?=";
  } else if (param.name) {
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
  functionDetails: OpcodeMeta,
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

    const args = getArgumentsFromFunctionLike(match[0]);
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

    // Only add parameter decorations for non-varargs functions when enabled
    if (!functionDetails.varargs && showParameterDecorations) {
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
  functionDetails: OpcodeMeta,
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
