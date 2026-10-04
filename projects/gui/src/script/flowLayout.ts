/**
 * Positions a `FlowGraph` for drawing: every node gets a size from its text and a centre from a
 * layered (top-to-bottom) dagre layout, and every edge gets the polyline dagre routes for it plus
 * a spot for its label.
 */

import dagre from "@dagrejs/dagre";
import type { FlowGraph, GraphEdge, GraphNode } from "./flowGraph";

export type Point = { x: number; y: number };

export type PositionedNode = {
  node: GraphNode;
  /** Centre of the node. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Text already wrapped and cut to fit the shape, one entry per drawn row. */
  rows: string[];
};

export type PositionedEdge = {
  edge: GraphEdge;
  points: Point[];
  /** Centre of the label, when the edge has one. */
  labelAt?: Point;
};

export type FlowLayout = {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  width: number;
  height: number;
};

/** Typography the layout assumes; `FlowDiagram` draws with the same values. */
export const FONT = {
  /** Monospace size for instruction rows and condition text. */
  size: 11,
  /** Row pitch for that size. */
  lineHeight: 15,
  /** Average advance of a monospace glyph at `size`, in px. */
  charWidth: 6.7,
  /** Size of edge labels. */
  labelSize: 10,
} as const;

/** Instruction rows shown in a box before the rest is summarised as "+N more". */
const MAX_BLOCK_ROWS = 7;
/** Characters per row inside a diamond; longer conditions wrap. */
const DECISION_ROW_CHARS = 30;
const MAX_DECISION_ROWS = 4;
const PADDING_X = 12;
const PADDING_Y = 8;

export function layoutFlowGraph(graph: FlowGraph): FlowLayout {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "TB", nodesep: 32, ranksep: 48, edgesep: 12, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));

  const sized = new Map<string, { rows: string[]; width: number; height: number }>();
  for (const node of graph.nodes) {
    const size = measure(node);
    sized.set(node.id, size);
    g.setNode(node.id, { width: size.width, height: size.height });
  }
  for (const edge of graph.edges) {
    const label =
      edge.label !== undefined
        ? { width: textWidth(edge.label, FONT.labelSize) + 8, height: FONT.labelSize + 6, labelpos: "c" }
        : {};
    // Jumps back up the script and option fan-outs matter less to the vertical order than the
    // straight-line flow, so they are the edges dagre bends when it has to.
    const weight = edge.kind === "jump" || edge.kind === "option" || edge.kind === "handler" ? 1 : 2;
    g.setEdge(edge.from, edge.to, { ...label, weight }, edge.id);
  }

  dagre.layout(g);

  const nodes: PositionedNode[] = graph.nodes.map((node) => {
    const placed = g.node(node.id);
    const size = sized.get(node.id) as { rows: string[]; width: number; height: number };
    return { node, x: placed.x, y: placed.y, width: size.width, height: size.height, rows: size.rows };
  });
  const edges: PositionedEdge[] = graph.edges.map((edge) => {
    const placed = g.edge(edge.from, edge.to, edge.id);
    const labelAt =
      edge.label !== undefined && placed.x !== undefined ? { x: placed.x, y: placed.y as number } : undefined;
    return { edge, points: placed.points, labelAt };
  });

  const bounds = g.graph();
  return { nodes, edges, width: bounds.width ?? 0, height: bounds.height ?? 0 };
}

export function textWidth(text: string, size: number = FONT.size): number {
  return text.length * FONT.charWidth * (size / FONT.size);
}

function measure(node: GraphNode): { rows: string[]; width: number; height: number } {
  switch (node.kind) {
    case "block": {
      const rows = node.lines.length > MAX_BLOCK_ROWS + 1 ? node.lines.slice(0, MAX_BLOCK_ROWS) : [...node.lines];
      if (node.lines.length > rows.length) {
        rows.push(`… ${node.lines.length - rows.length} more`);
      }
      const titleRows = node.title === "" ? 0 : 1;
      const longest = Math.max(...rows.map((row) => row.length), node.title.length, 8);
      return {
        rows,
        width: textWidth("x".repeat(longest)) + PADDING_X * 2,
        height:
          (rows.length + titleRows) * FONT.lineHeight + PADDING_Y * 2 + (titleRows > 0 && rows.length > 0 ? 4 : 0),
      };
    }
    case "decision": {
      const rows = wrap(node.condition, DECISION_ROW_CHARS, MAX_DECISION_ROWS);
      const longest = Math.max(...rows.map((row) => row.length));
      // A w×h rectangle fits inside a diamond of diagonals W, H when w/W + h/H = 1
      const textW = textWidth("x".repeat(longest)) + PADDING_X;
      const textH = rows.length * FONT.lineHeight + PADDING_Y;
      return { rows, width: textW / 0.6, height: textH / 0.4 };
    }
    case "menu":
    case "handlers":
      return { rows: [node.title], width: textWidth(node.title, 12) + PADDING_X * 2 + 24, height: 36 };
    case "start":
    case "end":
    case "missing": {
      const text = node.label.length > 40 ? `${node.label.slice(0, 39)}…` : node.label;
      return { rows: [text], width: textWidth(text) + PADDING_X * 2 + 8, height: 30 };
    }
  }
}

/** `text` split at its spaces into rows of at most `chars`; past `maxRows` the rest is cut with an ellipsis. */
function wrap(text: string, chars: number, maxRows: number): string[] {
  const words = text.split(" ").filter((word) => word !== "");
  const rows: string[] = [];
  let row = "";
  for (const word of words) {
    const candidate = row === "" ? word : `${row} ${word}`;
    if (candidate.length <= chars || row === "") {
      row = candidate;
    } else {
      rows.push(row);
      row = word;
    }
  }
  if (row !== "") {
    rows.push(row);
  }
  if (rows.length > maxRows) {
    const kept = rows.slice(0, maxRows);
    kept[maxRows - 1] = `${kept[maxRows - 1].slice(0, chars - 1)}…`;
    return kept;
  }
  return rows;
}
