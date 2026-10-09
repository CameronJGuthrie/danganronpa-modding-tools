import * as path from "node:path";
import * as vscode from "vscode";
import type { LinscriptInstruction, ParameterMeta } from "../instructions/linscript-instruction";
import { logDebug } from "../output";
import { argumentNames } from "../util/argument-names";
import { argumentIndexAt, findCallAt, lookupInstruction, resolveTable } from "../util/call-at";
import { metaEntryForScope } from "../util/script-meta";
import { INVISIBLE_SPRITE } from "linscript-definitions";
import { findSpriteImagePath, spriteHeadImagePath, spriteLabel } from "./sprite-image";
import { type ArgumentNames, getArgumentsFromFunctionLike, stripBranchJump } from "../util/string-util";

/**
 * Hover documentation for `.linscript` files.
 *
 * - Hovering an instruction name (`Speaker` in `Speaker(Makoto)`) shows what the instruction does,
 *   and its parameter list.
 * - Hovering an argument shows that parameter's name and description and, when the value has a
 *   known name (a character, a flag, a sound), that name too.
 *
 * Everything shown comes from `src/instructions`, the same table the inline decorations use.
 */
export class LinscriptHoverProvider implements vscode.HoverProvider {
  /** Where cropped sprite heads are cached (the extension's global storage). */
  constructor(private readonly cacheDir: string) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.Hover> {
    const lineText = document.lineAt(position.line).text;
    const call = findCallAt(lineText, position.character);
    if (!call) {
      return undefined;
    }

    const functionDetails = lookupInstruction(call.name);
    if (!functionDetails) {
      return undefined;
    }

    const nameRange = new vscode.Range(position.line, call.nameStart, position.line, call.nameStart + call.name.length);
    if (nameRange.contains(position)) {
      return new vscode.Hover(instructionHover(functionDetails), nameRange);
    }

    // Inside the parentheses: work out which argument the cursor is on
    // A condition's trailing Goto(label) is a call of its own, so the condition's text is read without it
    const rawCallText = lineText.slice(call.nameStart, call.end);
    const callText = functionDetails.branch ? stripBranchJump(rawCallText) : rawCallText;
    const argIndex = argumentIndexAt(callText, position.character - call.nameStart);
    if (argIndex === undefined) {
      return undefined;
    }

    const names = argumentNames(functionDetails, callText, document.getText());
    const args = getArgumentsFromFunctionLike(callText, names);
    const arg = args[argIndex];
    if (!arg || callText[arg.stringIndex] === '"') {
      return undefined;
    }

    const parameter: ParameterMeta | undefined = functionDetails.varargs
      ? undefined
      : functionDetails.parameters[argIndex];
    const table = resolveTable(names[argIndex], args, argIndex);
    const markdown = argumentHover(functionDetails, parameter, argIndex, arg.value, table);
    if (!markdown) {
      return undefined;
    }

    if (isSpriteExpression(functionDetails, argIndex)) {
      appendSpriteImages(markdown, args[1]?.value, arg.value, this.cacheDir);
    }

    const argRange = argumentRange(position.line, call.nameStart, callText, argIndex);
    return new vscode.Hover(markdown, argRange);
  }
}

export function registerHoverProvider(context: vscode.ExtensionContext) {
  const provider = new LinscriptHoverProvider(path.join(context.globalStorageUri.fsPath, "sprite-heads"));
  context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "linscript" }, provider));
  logDebug("Hover provider registered");
}

/** The editor range of one argument so the hover highlights just that argument. */
function argumentRange(line: number, callStart: number, callText: string, argIndex: number): vscode.Range | undefined {
  const args = getArgumentsFromFunctionLike(callText);
  const arg = args[argIndex];
  if (!arg) {
    return undefined;
  }
  const rest = callText.slice(arg.stringIndex);
  const length = rest.search(/\s*[,)]|$/);
  const start = callStart + arg.stringIndex;
  return new vscode.Range(line, start, line, start + Math.max(length, 1));
}

/** The enum member (or scoped name) for `value` in a name table, ignoring the reverse numeric keys. */
function nameForValue(table: ArgumentNames | undefined, value: number): string | undefined {
  if (!table) {
    return undefined;
  }
  for (const [key, mapped] of Object.entries(table)) {
    if (mapped === value && !/^\d+$/.test(key)) {
      return key;
    }
  }
  return undefined;
}

/** The label (and optional description) a parameter's `values` table gives for `value`. */
function valueEntry(
  parameter: ParameterMeta | undefined,
  value: number,
): { name: string; description?: string } | undefined {
  const entry = parameter?.values?.[value];
  if (entry === undefined) {
    return undefined;
  }
  return typeof entry === "string" ? { name: entry } : entry;
}

function parameterLabel(parameter: ParameterMeta | undefined, index: number): string {
  return parameter?.name || `arg${index + 1}`;
}

function signature(functionDetails: LinscriptInstruction): string {
  if (functionDetails.varargs) {
    return `${functionDetails.name}(...)`;
  }
  if (functionDetails.name === "Text" || functionDetails.name === "TextEager" || functionDetails.name === "RawText") {
    return `${functionDetails.name}("...")`;
  }
  if (functionDetails.name === "Option") {
    return `${functionDetails.name}(id, "label")`;
  }
  const params = functionDetails.parameters.map((parameter, index) => {
    const label = parameterLabel(parameter, index);
    return parameter.defaultValue === undefined ? label : `${label}?`;
  });
  return `${functionDetails.name}(${params.join(", ")})`;
}

function instructionHover(functionDetails: LinscriptInstruction): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendCodeblock(signature(functionDetails), "linscript");

  if (functionDetails.annotation) {
    md.appendMarkdown("Source-only annotation; has no binary form.\n\n");
  } else if (functionDetails.sugar) {
    md.appendMarkdown("Source sugar; the compiler expands it to binary opcodes.\n\n");
  }

  if (functionDetails.description) {
    md.appendMarkdown(`${tidy(functionDetails.description)}\n\n`);
  }

  if (!functionDetails.varargs && functionDetails.parameters.length > 0) {
    md.appendMarkdown("---\n\n**Parameters**\n\n");
    functionDetails.parameters.forEach((parameter, index) => {
      md.appendMarkdown(`- ${parameterLine(parameter, index)}\n`);
    });
  }

  return md;
}

function parameterLine(parameter: ParameterMeta, index: number): string {
  const label = `\`${parameterLabel(parameter, index)}\``;
  const notes: string[] = [];
  if (parameter.unknown) {
    notes.push("_(unknown)_");
  }
  if (parameter.description) {
    notes.push(tidy(parameter.description));
  }
  if (parameter.defaultValue !== undefined) {
    notes.push(`defaults to ${parameter.defaultValue}`);
  }
  if (parameter.scope) {
    notes.push(`named in the \`Meta()\` block with \`${metaEntryForScope(parameter.scope)}(id, Name)\``);
  }
  return notes.length === 0 ? label : `${label}: ${notes.join(". ")}`;
}

function argumentHover(
  functionDetails: LinscriptInstruction,
  parameter: ParameterMeta | undefined,
  index: number,
  value: number,
  table: ArgumentNames | undefined,
): vscode.MarkdownString | undefined {
  const md = new vscode.MarkdownString();
  const label = parameterLabel(parameter, index);
  md.appendMarkdown(`**${functionDetails.name}** › \`${label}\`\n\n`);

  const lines: string[] = [];
  if (parameter?.unknown) {
    lines.push("_Meaning not yet understood._");
  }
  if (parameter?.description) {
    lines.push(tidy(parameter.description));
  }

  if (!Number.isNaN(value)) {
    const enumName = nameForValue(table, value);
    const entry = valueEntry(parameter, value);
    const resolved = enumName ?? entry?.name;
    if (resolved !== undefined) {
      // A values table may either name the value or describe it; when the enum already names it,
      // the table's label serves as the description
      const detail = entry?.description ?? (entry && entry.name !== resolved ? entry.name : undefined);
      lines.push(`\`${value}\` = **${resolved}**${detail ? `: ${tidy(detail)}` : ""}`);
    } else {
      lines.push(`Value \`${value}\``);
    }
  } else if (functionDetails.varargs) {
    lines.push("Value");
  } else {
    lines.push("_Unrecognised name._");
  }

  if (parameter?.scope) {
    lines.push(`Declared per script with \`${metaEntryForScope(parameter.scope)}(id, Name)\` in the \`Meta()\` block.`);
  }

  md.appendMarkdown(lines.join("\n\n"));
  return md;
}

/** True for the expression argument of `Sprite` / `PlaceSprite`, whose hover shows the bust-up. */
function isSpriteExpression(functionDetails: LinscriptInstruction, argIndex: number): boolean {
  return (functionDetails.name === "Sprite" || functionDetails.name === "PlaceSprite") && argIndex === 1;
}

/** The bust-up textures are 480×512; the hover shows the full sprite no taller than this. */
const SPRITE_HOVER_HEIGHT = 300;
/**
 * Beside it, this many rows of the texture from its first visible row (the top of the head), which
 * takes in the head whatever the sprite's margin. Shown at the same height as the full sprite.
 */
const SPRITE_HEAD_ROWS = 350;

/**
 * Append the sprite's images side by side: the head (the texture from its first visible row,
 * cropped to a cached file since the hover cannot crop in place) and the full bust-up scaled down. Sizing needs
 * `<img>` tags and `supportHtml`, as Markdown image syntax cannot size. Only a `.png` renders in
 * a hover, so a raw `.tga` (the textures before `pnpm run reset --convert image`) gets a note.
 */
function appendSpriteImages(
  md: vscode.MarkdownString,
  character: number | undefined,
  expression: number,
  cacheDir: string,
): void {
  if (character === undefined || Number.isNaN(character) || Number.isNaN(expression)) {
    return;
  }
  // The transparent sprite has nothing to show
  if (expression === INVISIBLE_SPRITE) {
    return;
  }
  const imagePath = findSpriteImagePath(character, expression);
  const label = spriteLabel(character, expression);
  if (imagePath === null) {
    md.appendMarkdown(`\n\n_No texture found for ${label}._`);
    return;
  }
  if (!imagePath.endsWith(".png")) {
    md.appendMarkdown(
      `\n\n_${label} is only available as a .tga; run \`pnpm run reset --convert image\` to see it here._`,
    );
    return;
  }
  const headPath = spriteHeadImagePath(imagePath, SPRITE_HEAD_ROWS, cacheDir);
  const images = [
    headPath === null ? undefined : image(headPath, `${label} (head)`, SPRITE_HOVER_HEIGHT),
    image(imagePath, label, SPRITE_HOVER_HEIGHT),
  ].filter((tag) => tag !== undefined);
  md.supportHtml = true;
  md.appendMarkdown(`\n\n${images.join(" ")}`);
}

function image(filePath: string, alt: string, height: number): string {
  return `<img src="${vscode.Uri.file(filePath).toString()}" alt="${alt}" height="${height}">`;
}

/** Collapse template-literal descriptions written over several indented lines into one paragraph. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}
