/**
 * Builds a control-flow tree from decompiled linscript source.
 *
 * The tree is derived from three conventions in the decompiled output:
 *  - `Label(n)` at the top level starts a new straight-line block.
 *  - `OnCharacter(n)` / `OnObject(n)` register interaction handlers; each handler's body is
 *    the indented lines that follow it, and the group is closed by `OnObject(255)`.
 *  - `SetOption(n)` (or its labelled sugar `Option(n, "label")`) registers a menu option; the body
 *    is the indented lines that follow it, and the menu is closed by `SetOption(255)`.
 *  - `Meta()` at the top level starts the per-script annotations (object and option names) that run to the end
 *    of the file.
 *
 * `Goto(n)` lines are resolved against the labels so the UI can offer jump navigation.
 */

export type ScriptLine = {
  /** 1-based line number in the original source. */
  lineNumber: number;
  /** Indentation depth (2 spaces per level in the decompiler output). */
  depth: number;
  functionName: string;
  /** Raw argument text between the parentheses, split on top-level commas. */
  args: string[];
  /** The trimmed source text of the line; empty for a blank line. */
  text: string;
};

/** True for a blank source line, which is kept so the editor can show and fill it. */
export function isBlank(line: ScriptLine): boolean {
  return line.text === "";
}

export type FlowNodeKind = "script" | "block" | "handlerGroup" | "handler" | "menu" | "option" | "meta";

export type FlowItem = { kind: "line"; line: ScriptLine } | { kind: "node"; node: FlowNode };

export type FlowNode = {
  id: string;
  kind: FlowNodeKind;
  title: string;
  subtitle?: string;
  /** Lines and child nodes belonging to this node, in source order. */
  items: FlowItem[];
  children: FlowNode[];
  startLine: number;
  endLine: number;
};

export type ControlFlow = {
  root: FlowNode;
  /** Label number -> id of the node that contains that label. */
  labelOwners: Map<number, string>;
  /** Node id -> node, for quick lookup. */
  nodesById: Map<string, FlowNode>;
};

const TERMINATOR = 255;
const INDENT_WIDTH = 2;

export function parseScriptLines(source: string): ScriptLine[] {
  const lines: ScriptLine[] = [];
  const rawLines = source.replace(/^﻿/, "").split(/\r?\n/);

  rawLines.forEach((raw, index) => {
    // Blank lines are kept (with their indentation) so they render as editable rows
    const leading = raw.length - raw.trimStart().length;
    const text = raw.trim();
    const match = text.match(/^(\w+)\((.*)\)$/s);
    const functionName = match ? match[1] : text;
    const args = match ? splitArgs(match[2]) : [];

    lines.push({
      lineNumber: index + 1,
      depth: Math.floor(leading / INDENT_WIDTH),
      functionName,
      args,
      text,
    });
  });

  return lines;
}

/**
 * Split on commas that are not inside a string literal or a nested call, so the trailing
 * instructions of `Text("...", SetUI(Rumble, Hidden))` stay whole.
 */
function splitArgs(argText: string): string[] {
  if (argText.trim() === "") {
    return [];
  }
  const args: string[] = [];
  let current = "";
  let inString = false;
  let depth = 0;
  for (let i = 0; i < argText.length; i++) {
    const char = argText[i];
    if (char === '"' && argText[i - 1] !== "\\") {
      inString = !inString;
    } else if (!inString && char === "(") {
      depth++;
    } else if (!inString && char === ")") {
      depth--;
    }
    if (char === "," && !inString && depth === 0) {
      args.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  args.push(current.trim());
  return args;
}

export function buildControlFlow(source: string, scriptName: string): ControlFlow {
  const lines = parseScriptLines(source);
  const builder = new FlowBuilder();
  const root = builder.parseTopLevel(lines, scriptName);

  const nodesById = new Map<string, FlowNode>();
  const labelOwners = new Map<number, string>();
  indexNodes(root, nodesById, labelOwners);

  return { root, labelOwners, nodesById };
}

function indexNodes(node: FlowNode, nodesById: Map<string, FlowNode>, labelOwners: Map<number, string>) {
  nodesById.set(node.id, node);
  for (const item of node.items) {
    if (item.kind === "line" && item.line.functionName === "Label") {
      const label = firstNumber(item.line);
      if (label !== undefined) {
        labelOwners.set(label, node.id);
      }
    }
  }
  for (const child of node.children) {
    indexNodes(child, nodesById, labelOwners);
  }
}

export function firstNumber(line: ScriptLine): number | undefined {
  const value = Number.parseInt(line.args[0] ?? "", 10);
  return Number.isNaN(value) ? undefined : value;
}

function isOptionRegistration(line: ScriptLine): boolean {
  return line.functionName === "SetOption" || line.functionName === "Option";
}

/** Strip a linscript string literal (argument `argIndex`) down to readable text for use in tree subtitles. */
export function previewText(line: ScriptLine, maxLength = 48, argIndex = 0): string | undefined {
  const arg = line.args[argIndex];
  if (!arg?.startsWith('"')) {
    return undefined;
  }
  const text = arg
    .slice(1, -1)
    .replace(/<\/?[A-Za-z][A-Za-z0-9]*>|<style \d+>|<CLT[^>]*>/g, "")
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

class FlowBuilder {
  private nextId = 0;

  private createNode(kind: FlowNodeKind, title: string, startLine: number): FlowNode {
    this.nextId += 1;
    return {
      id: `${kind}-${this.nextId}`,
      kind,
      title,
      items: [],
      children: [],
      startLine,
      endLine: startLine,
    };
  }

  private addLine(node: FlowNode, line: ScriptLine) {
    node.items.push({ kind: "line", line });
    node.endLine = Math.max(node.endLine, line.lineNumber);
  }

  private addChild(node: FlowNode, child: FlowNode) {
    node.items.push({ kind: "node", node: child });
    node.children.push(child);
    node.endLine = Math.max(node.endLine, child.endLine);
  }

  parseTopLevel(lines: ScriptLine[], scriptName: string): FlowNode {
    const root = this.createNode("script", scriptName, lines[0]?.lineNumber ?? 1);
    let block = this.createNode("block", "Entry", root.startLine);
    let blockHasBody = false;

    const flushBlock = () => {
      if (block.items.length > 0) {
        finishBlock(block);
        this.addChild(root, block);
      }
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.functionName === "Meta") {
        // Everything from here on is annotation, not script
        flushBlock();
        this.addChild(root, this.parseMeta(lines, i));
        block = this.createNode("block", "", line.lineNumber);
        break;
      }

      if (isHandlerRegistration(line)) {
        flushBlock();
        const [group, next] = this.parseHandlerGroup(lines, i, line.depth);
        this.addChild(root, group);
        block = this.createNode("block", "", next < lines.length ? lines[next].lineNumber : group.endLine);
        blockHasBody = false;
        i = next;
        continue;
      }

      if (line.functionName === "Label" && blockHasBody) {
        // A label after real instructions starts a new straight-line block.
        flushBlock();
        block = this.createNode("block", "", line.lineNumber);
        blockHasBody = false;
      }

      if (line.functionName !== "Label" && !isBlank(line)) {
        blockHasBody = true;
      }
      this.addLine(block, line);
      i += 1;
    }
    flushBlock();
    root.endLine = lines[lines.length - 1]?.lineNumber ?? root.startLine;
    return root;
  }

  /** Collects the `Meta()` line and everything after it. */
  private parseMeta(lines: ScriptLine[], start: number): FlowNode {
    const meta = this.createNode("meta", "Meta", lines[start].lineNumber);
    for (const line of lines.slice(start)) {
      this.addLine(meta, line);
    }
    const count = (name: string) =>
      meta.items.filter((item) => item.kind === "line" && item.line.functionName === name).length;
    const objects = count("Object");
    const options = count("Option");
    const parts = [`${objects} object name${objects === 1 ? "" : "s"}`];
    if (options > 0) {
      parts.push(`${options} option name${options === 1 ? "" : "s"}`);
    }
    meta.subtitle = parts.join(", ");
    return meta;
  }

  /** Parses `OnCharacter(...)` / `OnObject(...)` registrations until `OnObject(255)`. */
  private parseHandlerGroup(lines: ScriptLine[], start: number, depth: number): [FlowNode, number] {
    const group = this.createNode("handlerGroup", "Interaction handlers", lines[start].lineNumber);
    let i = start;
    let handlerCount = 0;

    while (i < lines.length && lines[i].depth === depth && isHandlerRegistration(lines[i])) {
      const line = lines[i];
      const target = firstNumber(line);

      if (target === TERMINATOR) {
        this.addLine(group, line);
        i += 1;
        if (line.functionName === "OnObject") {
          break;
        }
        continue;
      }

      const handler = this.createNode("handler", line.text, line.lineNumber);
      const [bodyEnd] = this.parseBody(lines, i + 1, depth + 1, handler);
      handler.subtitle = describeHandler(handler);
      this.addChild(group, handler);
      handlerCount += 1;
      i = bodyEnd;
    }

    group.subtitle = `${handlerCount} handler${handlerCount === 1 ? "" : "s"}`;
    return [group, i];
  }

  /** Parses `SetOption(...)` registrations until `SetOption(255)`. */
  private parseMenu(lines: ScriptLine[], start: number, depth: number): [FlowNode, number] {
    const menu = this.createNode("menu", "Menu", lines[start].lineNumber);
    let i = start;

    while (i < lines.length && lines[i].depth === depth && isOptionRegistration(lines[i])) {
      const line = lines[i];
      const target = firstNumber(line);

      if (target === TERMINATOR) {
        this.addLine(menu, line);
        i += 1;
        break;
      }

      const option = this.createNode("option", line.text, line.lineNumber);
      const [bodyEnd] = this.parseBody(lines, i + 1, depth + 1, option);
      // Option(n, "label") carries its label; a bare SetOption is described by its first text line
      option.subtitle = line.functionName === "Option" ? previewText(line, 48, 1) : firstTextPreview(option);
      this.addChild(menu, option);
      i = bodyEnd;
    }

    const optionLabels = menu.children.map((child) => child.subtitle).filter((label): label is string => !!label);
    menu.subtitle = optionLabels.length > 0 ? optionLabels.join(" / ") : `${menu.children.length} options`;
    return [menu, i];
  }

  /** Consumes lines at `depth` (or deeper) into `parent`, nesting menus and handler groups. */
  private parseBody(lines: ScriptLine[], start: number, depth: number, parent: FlowNode): [number] {
    let i = start;
    while (i < lines.length && lines[i].depth >= depth) {
      const line = lines[i];

      if (line.depth === depth && isOptionRegistration(line)) {
        const [menu, next] = this.parseMenu(lines, i, depth);
        this.addChild(parent, menu);
        i = next;
        continue;
      }

      if (line.depth === depth && isHandlerRegistration(line)) {
        const [group, next] = this.parseHandlerGroup(lines, i, depth);
        this.addChild(parent, group);
        i = next;
        continue;
      }

      this.addLine(parent, line);
      i += 1;
    }
    return [i];
  }
}

function isHandlerRegistration(line: ScriptLine): boolean {
  return line.functionName === "OnObject" || line.functionName === "OnCharacter";
}

function finishBlock(block: FlowNode) {
  const labels = block.items
    .filter((item): item is { kind: "line"; line: ScriptLine } => item.kind === "line")
    .map((item) => item.line)
    .filter((line) => line.functionName === "Label")
    .map((line) => line.text);

  if (block.title === "") {
    block.title = labels.length > 0 ? labels.join(", ") : `Line ${block.startLine}`;
  } else if (labels.length > 0) {
    block.title = `${block.title} (${labels.join(", ")})`;
  }

  const lineCount = block.items.filter((item) => item.kind === "line" && !isBlank(item.line)).length;
  const preview = firstTextPreview(block);
  block.subtitle = preview ?? `${lineCount} instruction${lineCount === 1 ? "" : "s"}`;
}

function describeHandler(handler: FlowNode): string | undefined {
  const preview = firstTextPreview(handler);
  if (preview) {
    return preview;
  }
  if (handler.children.some((child) => child.kind === "menu")) {
    return "Menu";
  }
  return undefined;
}

function firstTextPreview(node: FlowNode): string | undefined {
  for (const item of node.items) {
    if (item.kind === "line" && (item.line.functionName === "Text" || item.line.functionName === "RawText")) {
      const preview = previewText(item.line);
      if (preview) {
        return preview;
      }
    }
  }
  return undefined;
}
