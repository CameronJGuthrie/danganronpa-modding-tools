import * as vscode from "vscode";
import { instructions } from "../instructions";
import { logDebug } from "../output";
import type { LinscriptInstruction, ParameterMeta } from "../types/linscript-instruction";
import { argumentNames } from "../util/argument-names";
import { metaEntryForScope } from "../util/script-meta";
import type { ArgumentNameSource, ArgumentNames, DependentNames } from "../util/string-util";
import { getArgumentsFromFunctionLike, isInsideQuotes, stripBranchJump } from "../util/string-util";

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

    const argRange = argumentRange(position.line, call.nameStart, callText, argIndex);
    return new vscode.Hover(markdown, argRange);
  }
}

export function registerHoverProvider(context: vscode.ExtensionContext) {
  const provider = new LinscriptHoverProvider();
  context.subscriptions.push(vscode.languages.registerHoverProvider({ language: "linscript" }, provider));
  logDebug("Hover provider registered");
}

type CallAt = { name: string; nameStart: number; end: number };

/**
 * The innermost instruction call whose name or parentheses contain `character` on this line, if
 * any. The closing parenthesis may be missing (a multi-line `Text(...)`), in which case the call runs to the
 * end of the line.
 */
function findCallAt(lineText: string, character: number): CallAt | undefined {
  const pattern = /([A-Za-z_]\w*)\s*\(/g;
  let innermost: CallAt | undefined;
  let match: RegExpExecArray | null = pattern.exec(lineText);
  while (match) {
    const nameStart = match.index;
    if (!isInsideQuotes(lineText, nameStart)) {
      const openParen = nameStart + match[0].length - 1;
      const closeParen = findClosingParen(lineText, openParen);
      const end = closeParen === -1 ? lineText.length : closeParen + 1;
      if (character >= nameStart && character < end) {
        // Later matches start further right, so a match containing the position is nested inside
        // any earlier one that also contains it: keep the innermost, e.g. Wait(10) within Text(...)
        innermost = { name: match[1], nameStart, end };
      }
    }
    match = pattern.exec(lineText);
  }
  return innermost;
}

/** Index of the parenthesis closing the one at `openParen`, ignoring parentheses inside quotes. */
function findClosingParen(text: string, openParen: number): number {
  let depth = 0;
  let inQuotes = false;
  for (let i = openParen; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i - 1] !== "\\") {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === "(") {
      depth += 1;
    } else if (!inQuotes && char === ")") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

/** Which comma-separated argument of `callText` (starting at the name) contains `offset`. */
function argumentIndexAt(callText: string, offset: number): number | undefined {
  const openParen = callText.indexOf("(");
  if (openParen === -1 || offset <= openParen) {
    return undefined;
  }
  let index = 0;
  let inQuotes = false;
  for (let i = openParen + 1; i < offset && i < callText.length; i++) {
    const char = callText[i];
    if (char === '"' && callText[i - 1] !== "\\") {
      inQuotes = !inQuotes;
    } else if (!inQuotes && char === ",") {
      index += 1;
    } else if (!inQuotes && char === ")") {
      return undefined;
    }
  }
  return index;
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

function lookupInstruction(name: string): LinscriptInstruction | undefined {
  return Object.hasOwn(instructions, name) ? instructions[name as keyof typeof instructions] : undefined;
}

function isDependent(source: ArgumentNameSource): source is DependentNames {
  return source !== undefined && "tables" in source;
}

/** The concrete name table for one argument, following a dependent table to the argument it keys on. */
function resolveTable(
  source: ArgumentNameSource,
  args: readonly { value: number }[],
  argIndex: number,
): ArgumentNames | undefined {
  if (!isDependent(source)) {
    return source;
  }
  const keyValue = args[argIndex + source.argument]?.value;
  return keyValue === undefined ? undefined : source.tables[keyValue];
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
  if (functionDetails.name === "Text" || functionDetails.name === "RawText") {
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

/** Collapse template-literal descriptions written over several indented lines into one paragraph. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}
