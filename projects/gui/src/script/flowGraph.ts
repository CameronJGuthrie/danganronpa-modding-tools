/**
 * Builds a flowchart graph from a script's control flow: boxes for straight-line runs of
 * instructions, diamonds for conditions, and labelled fan-outs for menus and interaction handlers.
 *
 * The graph is derived from the `ControlFlow` tree plus the line conventions it already encodes:
 *  - a `Label` starts a new box, and is what `Goto` edges resolve to;
 *  - a condition (`If`, `IfFlag`, ...) becomes a diamond with a "yes" edge to its `Goto` target and a
 *    "no" edge to whatever follows it;
 *  - `Goto` ends the current box with a jump edge;
 *  - `StopScript`, `Return` and `LoadScript` end the current box in a terminal;
 *  - a menu node fans out to the first box of each option's body, labelled with the option, and a
 *    handler group fans out to each handler's body; both also continue to the code after them.
 * Code with no way in (a second `StopScript()`, an instruction after an unconditional `Goto`) is
 * dropped rather than drawn as an island; menus and handler groups are the exception, since the
 * player's interaction reaches them.
 */

import {
  type ControlFlow,
  type FlowItem,
  type FlowNode,
  isBlank,
  isCondition,
  jumpTarget,
  type LabelRef,
  labelRef,
  parseLabelNames,
  parseScriptLines,
  previewText,
  type ScriptLine,
} from "./controlFlow";

export type GraphNode =
  | { id: string; kind: "start"; label: string; startLine: number; endLine: number }
  | {
      id: string;
      kind: "block";
      /** The labels the box starts with, e.g. `Label(500)`; empty for an unlabelled run. */
      title: string;
      /** One entry per non-blank instruction, abbreviated for display. */
      lines: string[];
      startLine: number;
      endLine: number;
    }
  | {
      id: string;
      kind: "decision";
      /** The condition without its trailing jump, e.g. `IfFlag(System, HandbookEnabled, ==, True)`. */
      condition: string;
      startLine: number;
      endLine: number;
    }
  | { id: string; kind: "menu"; title: string; startLine: number; endLine: number }
  | { id: string; kind: "handlers"; title: string; startLine: number; endLine: number }
  | { id: string; kind: "end"; label: string; startLine: number; endLine: number }
  /** The target of a `Goto` whose label is not in this script. */
  | { id: string; kind: "missing"; label: string; startLine: number; endLine: number };

export type GraphEdgeKind = "flow" | "yes" | "no" | "jump" | "option" | "handler";

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: GraphEdgeKind;
  label?: string;
};

export type FlowGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

/** Length at which a box's instruction text is cut. */
const MAX_LINE_CHARS = 44;

/** An outgoing edge waiting for the node that comes next. */
type Pending = { from: string; kind: GraphEdgeKind; label?: string };

/** A `Goto` whose target label is resolved once every label has been seen. */
type Jump = Pending & { target: LabelRef };

/** `Omit` applied to each member of a union separately, so the members keep their own fields. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const TERMINATORS: ReadonlySet<string> = new Set(["StopScript", "Return", "LoadScript"]);

export function buildFlowGraph(flow: ControlFlow, source: string): FlowGraph {
  const builder = new GraphBuilder(parseLabelNames(parseScriptLines(source)));
  return builder.build(flow.root);
}

class GraphBuilder {
  private readonly nodes: GraphNode[] = [];
  private readonly edges: GraphEdge[] = [];
  private readonly jumps: Jump[] = [];
  /** Label (by number and by name) -> the box that starts there. */
  private readonly labelNodes = new Map<LabelRef, string>();
  private nextId = 0;

  /** The box instructions are currently being appended to, if any. */
  private current: Extract<GraphNode, { kind: "block" }> | null = null;
  /** Edges from finished nodes that will point at the next node created. */
  private pending: Pending[] = [];

  constructor(private readonly labelNames: ReadonlyMap<number, string>) {}

  build(root: FlowNode): FlowGraph {
    const start = this.add({ id: this.id("start"), kind: "start", label: "Start", startLine: 1, endLine: 1 });
    this.pending = [{ from: start.id, kind: "flow" }];

    for (const item of root.items) {
      if (item.kind === "node" && item.node.kind === "meta") {
        continue;
      }
      this.walkItem(item);
    }

    if (this.hasOpenPath()) {
      this.close({ kind: "end", label: "End", startLine: root.endLine, endLine: root.endLine });
    }
    this.resolveJumps();
    return { nodes: this.nodes, edges: this.edges };
  }

  private walkItems(items: readonly FlowItem[]) {
    for (const item of items) {
      this.walkItem(item);
    }
  }

  private walkItem(item: FlowItem) {
    if (item.kind === "node") {
      this.walkNode(item.node);
    } else {
      this.walkLine(item.line);
    }
  }

  private walkNode(node: FlowNode) {
    switch (node.kind) {
      case "block":
      case "script":
        this.walkItems(node.items);
        return;
      case "menu":
        this.walkFanOut(node, "menu", "option", (option) => option.subtitle ?? option.title);
        return;
      case "handlerGroup":
        this.walkFanOut(node, "handlers", "handler", (handler) => handler.title);
        return;
      case "handler":
      case "option":
        // Reached only through walkFanOut, which walks the bodies itself
        this.walkItems(node.items);
        return;
      case "meta":
        return;
    }
  }

  /**
   * A menu or handler group: one node fanning out to each child's body with a labelled edge. The
   * ends of the bodies, and the node itself, continue to whatever follows the group.
   */
  private walkFanOut(
    group: FlowNode,
    kind: "menu" | "handlers",
    edgeKind: GraphEdgeKind,
    edgeLabel: (child: FlowNode) => string,
  ) {
    // The group is drawn even when a `Goto` skips over its registration: the game runs handlers and
    // options on the player's interaction, so they are entry points of their own
    const title = kind === "menu" ? `Menu (${group.children.length})` : `Handlers (${group.children.length})`;
    const node = this.close({ kind, title, startLine: group.startLine, endLine: group.endLine });

    const after: Pending[] = [{ from: node.id, kind: "flow" }];
    for (const child of group.children) {
      this.current = null;
      this.pending = [{ from: node.id, kind: edgeKind, label: edgeLabel(child) }];
      this.walkItems(child.items);
      after.push(...this.flushOpenPath());
    }
    this.current = null;
    this.pending = after;
  }

  private walkLine(line: ScriptLine) {
    if (isBlank(line) || line.continuation) {
      return;
    }

    if (line.functionName === "Label") {
      this.walkLabel(line);
      return;
    }

    if (!this.hasOpenPath()) {
      // Unreachable: nothing flows into this instruction
      return;
    }

    if (isCondition(line)) {
      const target = jumpTarget(line);
      const node = this.close({
        kind: "decision",
        condition: conditionText(line),
        startLine: line.lineNumber,
        endLine: line.lineNumber,
      });
      if (target !== undefined) {
        this.jumps.push({ from: node.id, kind: "yes", target });
      }
      this.pending = [{ from: node.id, kind: "no" }];
      return;
    }

    if (line.functionName === "Goto") {
      const target = labelRef(line);
      for (const edge of this.flushOpenPath()) {
        if (target !== undefined) {
          this.jumps.push({ ...edge, kind: edge.kind === "flow" ? "jump" : edge.kind, target });
        }
      }
      return;
    }

    if (TERMINATORS.has(line.functionName)) {
      this.close({ kind: "end", label: line.text, startLine: line.lineNumber, endLine: line.lineNumber });
      return;
    }

    const block = this.current ?? this.openBlock("", line.lineNumber);
    block.lines.push(abbreviate(line));
    block.endLine = line.lineNumber;
  }

  private walkLabel(line: ScriptLine) {
    const label = labelRef(line);
    // A label on an empty box (consecutive labels, or the very first line) joins that box
    const block =
      this.current !== null && this.current.lines.length === 0
        ? this.current
        : this.openBlock("", line.lineNumber, this.hasOpenPath());
    block.title = block.title === "" ? line.text : `${block.title}, ${line.text}`;
    block.endLine = Math.max(block.endLine, line.lineNumber);
    if (label !== undefined) {
      this.registerLabel(label, block.id);
    }
  }

  private registerLabel(label: LabelRef, nodeId: string) {
    this.labelNodes.set(label, nodeId);
    if (typeof label === "number") {
      const name = this.labelNames.get(label);
      if (name !== undefined) {
        this.labelNodes.set(name, nodeId);
      }
    } else {
      for (const [id, name] of this.labelNames) {
        if (name === label) {
          this.labelNodes.set(id, nodeId);
        }
      }
    }
  }

  /**
   * Starts a new box and makes it current. With `connect`, the open path (the current box or the
   * pending edges) flows into it; otherwise the box has no entry yet and only a `Goto` can reach it.
   */
  private openBlock(title: string, startLine: number, connect = true): Extract<GraphNode, { kind: "block" }> {
    const block: Extract<GraphNode, { kind: "block" }> = {
      id: this.id("block"),
      kind: "block",
      title,
      lines: [],
      startLine,
      endLine: startLine,
    };
    if (connect) {
      this.connectPending(block.id);
    } else {
      this.pending = [];
    }
    this.nodes.push(block);
    this.current = block;
    return block;
  }

  /** Ends the current box with a node that everything open flows into; nothing stays open after it. */
  private close(node: DistributiveOmit<GraphNode, "id">): GraphNode {
    const added = this.add({ ...node, id: this.id(node.kind) } as GraphNode);
    this.connectPending(added.id);
    this.current = null;
    this.pending = [];
    return added;
  }

  private add<T extends GraphNode>(node: T): T {
    this.nodes.push(node);
    return node;
  }

  private hasOpenPath(): boolean {
    return this.current !== null || this.pending.length > 0;
  }

  /** The edges that would connect the open path to the next node, leaving nothing open. */
  private flushOpenPath(): Pending[] {
    const edges: Pending[] = this.current !== null ? [{ from: this.current.id, kind: "flow" }] : [...this.pending];
    this.current = null;
    this.pending = [];
    return edges;
  }

  private connectPending(to: string) {
    for (const edge of this.flushOpenPath()) {
      this.addEdge(edge, to);
    }
  }

  private addEdge(edge: Pending, to: string) {
    this.edges.push({ id: `edge-${this.edges.length}`, from: edge.from, to, kind: edge.kind, label: edge.label });
  }

  private resolveJumps() {
    const missing = new Map<LabelRef, string>();
    for (const jump of this.jumps) {
      let to = this.labelNodes.get(jump.target);
      if (to === undefined) {
        to = missing.get(jump.target);
        if (to === undefined) {
          const node = this.add({
            id: this.id("missing"),
            kind: "missing",
            label: `Label(${jump.target}) not found`,
            startLine: 0,
            endLine: 0,
          });
          to = node.id;
          missing.set(jump.target, to);
        }
      }
      this.addEdge(jump, to);
    }
  }

  private id(kind: string): string {
    this.nextId += 1;
    return `${kind}-${this.nextId}`;
  }
}

/** The condition as written, minus the `Goto(label)` it carries as its last argument. */
export function conditionText(line: ScriptLine): string {
  const args = line.args.slice(0, -1);
  return `${line.functionName}(${args.join(", ")})`;
}

/** A short single-line form of an instruction for a box: text lines show their words, the rest their source. */
function abbreviate(line: ScriptLine): string {
  if (line.functionName === "Text" || line.functionName === "RawText") {
    const preview = previewText(line, MAX_LINE_CHARS - 2);
    if (preview !== undefined) {
      return `"${preview}"`;
    }
  }
  const text = line.text.replace(/\s+/g, " ");
  return text.length > MAX_LINE_CHARS ? `${text.slice(0, MAX_LINE_CHARS - 1)}…` : text;
}
