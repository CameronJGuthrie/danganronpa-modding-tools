import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FlowGraph, GraphEdgeKind, GraphNode } from "../../script/flowGraph";
import {
  type FlowLayout,
  FONT,
  layoutFlowGraph,
  type Point,
  type PositionedEdge,
  type PositionedNode,
} from "../../script/flowLayout";

type FlowDiagramProps = {
  graph: FlowGraph;
  /** A line range to pick out, e.g. the node chosen in the control-flow tree; the view centres on it. */
  highlight?: { startLine: number; endLine: number } | null;
  /** Called with a line number when the user asks to see a shape's source. */
  onShowLine: (line: number) => void;
};

type Transform = { x: number; y: number; k: number };

const MIN_SCALE = 0.05;
const MAX_SCALE = 3;
/** Pointer travel below which a press-and-release counts as a click rather than a drag. */
const CLICK_SLOP = 4;
const ROW_PADDING_X = 12;
const ROW_PADDING_Y = 8;

/**
 * The script as a flowchart on a pannable, zoomable canvas: boxes for runs of instructions,
 * diamonds for conditions, and labelled fan-outs for menus and handlers. Drag to pan, scroll to
 * zoom, click a shape to select it and double-click to open its lines in the script view.
 */
export function FlowDiagram({ graph, highlight = null, onShowLine }: FlowDiagramProps) {
  const layout = useMemo(() => layoutFlowGraph(graph), [graph]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const drag = useRef<{ startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(
    null,
  );

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = useCallback(() => {
    if (size.width === 0 || size.height === 0 || layout.width === 0) {
      return;
    }
    const k = Math.min(size.width / layout.width, size.height / layout.height, 1);
    setTransform({
      x: (size.width - layout.width * k) / 2,
      y: (size.height - layout.height * k) / 2,
      k,
    });
  }, [size, layout]);

  // A new script, or the first measurement of the canvas, shows the whole chart
  const fitted = useRef<FlowLayout | null>(null);
  useEffect(() => {
    if (fitted.current !== layout && size.width > 0) {
      fitted.current = layout;
      fit();
      setSelectedId(null);
    }
  }, [layout, size, fit]);

  const highlighted = useMemo(() => {
    if (highlight === null) {
      return new Set<string>();
    }
    return new Set(
      layout.nodes
        .filter(({ node }) => node.startLine >= highlight.startLine && node.startLine <= highlight.endLine)
        .filter(({ node }) => node.kind !== "start" && node.kind !== "missing")
        .map(({ node }) => node.id),
    );
  }, [highlight, layout]);

  // Centre on the picked range, zooming in a little if the chart is shown very small
  useEffect(() => {
    if (highlight === null || size.width === 0) {
      return;
    }
    const first = layout.nodes.find(
      ({ node }) => node.startLine >= highlight.startLine && node.startLine <= highlight.endLine,
    );
    if (first === undefined) {
      return;
    }
    setTransform((previous) => {
      const k = Math.max(previous.k, 0.6);
      return { x: size.width / 2 - first.x * k, y: size.height / 2 - first.y * k, k };
    });
  }, [highlight, layout, size]);

  // Wheel zoom about the cursor; registered by hand so the event can be cancelled (React's is passive)
  useEffect(() => {
    const element = containerRef.current;
    if (element === null) {
      return;
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      const cx = event.clientX - bounds.left;
      const cy = event.clientY - bounds.top;
      setTransform((previous) => {
        const k = clamp(previous.k * Math.exp(-event.deltaY * 0.0015), MIN_SCALE, MAX_SCALE);
        const ratio = k / previous.k;
        return { x: cx - (cx - previous.x) * ratio, y: cy - (cy - previous.y) * ratio, k };
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    setTransform((previous) => {
      const k = clamp(previous.k * factor, MIN_SCALE, MAX_SCALE);
      const ratio = k / previous.k;
      const cx = size.width / 2;
      const cy = size.height / 2;
      return { x: cx - (cx - previous.x) * ratio, y: cy - (cy - previous.y) * ratio, k };
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
      moved: false,
    };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (state === null) {
      return;
    }
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < CLICK_SLOP) {
      return;
    }
    if (!state.moved) {
      // Capture only once this is a drag: capturing on press would make the click land on the
      // container instead of the shape under the pointer
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    state.moved = true;
    setTransform((previous) => ({ ...previous, x: state.originX + dx, y: state.originY + dy }));
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.moved && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    // Cleared after the click this release dispatches has had a chance to read `moved`
    setTimeout(() => {
      drag.current = null;
    }, 0);
  };
  /** True while the pointer-up that ends a drag is still dispatching its click. */
  const wasDrag = () => drag.current?.moved === true;

  const selected = selectedId === null ? null : (layout.nodes.find(({ node }) => node.id === selectedId) ?? null);

  if (graph.nodes.length <= 1) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Nothing to chart in this script.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Control-flow diagram: drag to pan, scroll to zoom, click a shape to select it"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the canvas is a focusable widget so Escape and Enter work on the selection
      tabIndex={0}
      className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden outline-none active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={() => {
        // A click on the background (one that reached here without a shape stopping it) clears the selection
        if (!wasDrag()) {
          setSelectedId(null);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setSelectedId(null);
        } else if (event.key === "Enter" && selected !== null && selected.node.startLine > 0) {
          onShowLine(selected.node.startLine);
        }
      }}
    >
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <marker
            id="flow-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
          </marker>
        </defs>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          {layout.edges.map((edge) => (
            <Edge key={edge.edge.id} edge={edge} nodes={layout.nodes} />
          ))}
          {layout.nodes.map((placed) => (
            <Shape
              key={placed.node.id}
              placed={placed}
              selected={placed.node.id === selectedId}
              highlighted={highlighted.has(placed.node.id)}
              onClick={(event) => {
                event.stopPropagation();
                if (!wasDrag()) {
                  setSelectedId(placed.node.id);
                }
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                if (placed.node.startLine > 0) {
                  onShowLine(placed.node.startLine);
                }
              }}
            />
          ))}
        </g>
      </svg>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: stops toolbar clicks reaching the canvas, which would clear the selection */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same; the buttons inside carry the keyboard handling */}
      <div
        className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 text-xs"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded bg-white/90 p-1 shadow dark:bg-slate-700/90">
          <ToolbarButton onClick={() => zoomBy(1 / 1.25)} title="Zoom out" label="−" />
          <ToolbarButton
            onClick={fit}
            title="Fit the whole chart in view"
            label={`${Math.round(transform.k * 100)}%`}
          />
          <ToolbarButton onClick={() => zoomBy(1.25)} title="Zoom in" label="+" />
          <span className="px-1 text-slate-500 dark:text-slate-400">
            {graph.nodes.length} shapes · {graph.edges.length} arrows
          </span>
        </div>
        {selected !== null && (
          <div className="pointer-events-auto flex items-center gap-2 rounded bg-white/90 p-1 pl-2 shadow dark:bg-slate-700/90">
            <span className="font-mono">{describe(selected.node)}</span>
            {selected.node.startLine > 0 && (
              <>
                <span className="text-slate-500 dark:text-slate-400">
                  {selected.node.endLine > selected.node.startLine
                    ? `lines ${selected.node.startLine}–${selected.node.endLine}`
                    : `line ${selected.node.startLine}`}
                </span>
                <ToolbarButton
                  onClick={() => onShowLine(selected.node.startLine)}
                  title="Open these lines in the script view (or double-click the shape)"
                  label="Show in script →"
                />
              </>
            )}
          </div>
        )}
      </div>

      <Legend />
    </div>
  );
}

function ToolbarButton({ onClick, title, label }: { onClick: () => void; title: string; label: string }) {
  return (
    <button
      type="button"
      className="rounded bg-slate-200 px-1.5 py-0.5 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
      onClick={onClick}
      title={title}
    >
      {label}
    </button>
  );
}

function describe(node: GraphNode): string {
  switch (node.kind) {
    case "block":
      return node.title === "" ? "Instructions" : node.title;
    case "decision":
      return node.condition.length > 60 ? `${node.condition.slice(0, 59)}…` : node.condition;
    case "menu":
    case "handlers":
      return node.title;
    case "start":
    case "end":
    case "missing":
      return node.label;
  }
}

/* ---------- shapes ---------- */

const SHAPE_FILL: Record<GraphNode["kind"], string> = {
  start: "fill-slate-200 stroke-slate-500 dark:fill-slate-600 dark:stroke-slate-400",
  end: "fill-slate-200 stroke-slate-500 dark:fill-slate-600 dark:stroke-slate-400",
  missing: "fill-rose-50 stroke-rose-400 dark:fill-rose-950 dark:stroke-rose-500",
  block: "fill-white stroke-slate-400 dark:fill-slate-700 dark:stroke-slate-500",
  decision: "fill-orange-50 stroke-orange-400 dark:fill-orange-950 dark:stroke-orange-500",
  menu: "fill-violet-100 stroke-violet-400 dark:fill-violet-900 dark:stroke-violet-500",
  handlers: "fill-amber-100 stroke-amber-400 dark:fill-amber-900 dark:stroke-amber-500",
};

const TEXT_CLASS = "fill-slate-900 dark:fill-slate-100";
const MUTED_TEXT_CLASS = "fill-slate-500 dark:fill-slate-400";

type ShapeProps = {
  placed: PositionedNode;
  selected: boolean;
  highlighted: boolean;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
};

function Shape({ placed, selected, highlighted, onClick, onDoubleClick }: ShapeProps) {
  const { node, x, y, width, height, rows } = placed;
  const left = x - width / 2;
  const top = y - height / 2;
  const outline = selected
    ? "stroke-blue-500 dark:stroke-blue-400"
    : highlighted
      ? "stroke-blue-400 dark:stroke-blue-500"
      : "";
  const strokeWidth = selected ? 2.5 : highlighted ? 2 : 1.25;
  const fill = `${SHAPE_FILL[node.kind]} ${outline}`;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a chart shape; the toolbar carries the keyboard-reachable action
    <g className="cursor-pointer" onClick={onClick} onDoubleClick={onDoubleClick}>
      <title>{describe(node)}</title>
      {node.kind === "decision" ? (
        <polygon
          points={`${x},${top} ${left + width},${y} ${x},${top + height} ${left},${y}`}
          className={fill}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ) : node.kind === "menu" ? (
        <polygon
          points={`${left + 10},${top} ${left + width},${top} ${left + width - 10},${top + height} ${left},${top + height}`}
          className={fill}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ) : (
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={node.kind === "block" ? 4 : node.kind === "handlers" ? 8 : height / 2}
          className={fill}
          strokeWidth={strokeWidth}
          strokeDasharray={node.kind === "missing" ? "5 3" : undefined}
        />
      )}
      {node.kind === "block" ? (
        <BlockText node={node} rows={rows} left={left} top={top} />
      ) : (
        <CentredText rows={rows} x={x} y={y} bold={node.kind !== "decision"} />
      )}
    </g>
  );
}

function BlockText({
  node,
  rows,
  left,
  top,
}: {
  node: Extract<GraphNode, { kind: "block" }>;
  rows: string[];
  left: number;
  top: number;
}) {
  const hasTitle = node.title !== "";
  const textX = left + ROW_PADDING_X;
  // Baseline of the first row: top padding plus most of the row height
  const baseline = top + ROW_PADDING_Y + FONT.lineHeight * 0.75;
  const rowStart = baseline + (hasTitle ? FONT.lineHeight + 4 : 0);
  return (
    <g className="pointer-events-none font-mono" style={{ fontSize: FONT.size }}>
      {hasTitle && (
        <text x={textX} y={baseline} className={`${TEXT_CLASS} font-semibold`} style={{ fontSize: 12 }}>
          {node.title}
        </text>
      )}
      {rows.map((row, index) => (
        <text
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional text with no identity
          key={index}
          x={textX}
          y={rowStart + index * FONT.lineHeight}
          className={row.startsWith("…") ? `${MUTED_TEXT_CLASS} italic` : TEXT_CLASS}
        >
          {row}
        </text>
      ))}
    </g>
  );
}

function CentredText({ rows, x, y, bold }: { rows: string[]; x: number; y: number; bold: boolean }) {
  const totalHeight = rows.length * FONT.lineHeight;
  const first = y - totalHeight / 2 + FONT.lineHeight * 0.75;
  return (
    <g
      className={`pointer-events-none font-mono ${TEXT_CLASS} ${bold ? "font-semibold" : ""}`}
      style={{ fontSize: FONT.size }}
    >
      {rows.map((row, index) => (
        <text
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional text with no identity
          key={index}
          x={x}
          y={first + index * FONT.lineHeight}
          textAnchor="middle"
        >
          {row}
        </text>
      ))}
    </g>
  );
}

/* ---------- edges ---------- */

const EDGE_STROKE: Record<GraphEdgeKind, string> = {
  flow: "stroke-slate-500 dark:stroke-slate-400",
  yes: "stroke-emerald-600 dark:stroke-emerald-400",
  no: "stroke-rose-500 dark:stroke-rose-400",
  jump: "stroke-sky-500 dark:stroke-sky-400",
  option: "stroke-violet-500 dark:stroke-violet-400",
  handler: "stroke-amber-600 dark:stroke-amber-400",
};

const EDGE_TEXT: Record<GraphEdgeKind, string> = {
  flow: "fill-slate-600 dark:fill-slate-300",
  yes: "fill-emerald-700 dark:fill-emerald-300",
  no: "fill-rose-600 dark:fill-rose-300",
  jump: "fill-sky-600 dark:fill-sky-300",
  option: "fill-violet-700 dark:fill-violet-300",
  handler: "fill-amber-700 dark:fill-amber-300",
};

function Edge({ edge, nodes }: { edge: PositionedEdge; nodes: PositionedNode[] }) {
  const points = trimToDiamonds(edge.points, edge.edge.from, edge.edge.to, nodes);
  const label = edge.edge.label ?? (edge.edge.kind === "yes" ? "yes" : edge.edge.kind === "no" ? "no" : undefined);
  const labelAt = edge.labelAt ?? (label !== undefined ? midpoint(points) : undefined);
  return (
    <g>
      <path
        d={smoothPath(points)}
        fill="none"
        className={EDGE_STROKE[edge.edge.kind]}
        strokeWidth={1.5}
        strokeDasharray={edge.edge.kind === "jump" ? "6 4" : undefined}
        markerEnd="url(#flow-arrow)"
      />
      {label !== undefined && labelAt !== undefined && (
        <text
          x={labelAt.x}
          y={labelAt.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`${EDGE_TEXT[edge.edge.kind]} stroke-white dark:stroke-slate-800`}
          style={{ fontSize: FONT.labelSize, paintOrder: "stroke", strokeWidth: 4, strokeLinejoin: "round" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** The polyline as a path with rounded corners: each inner point becomes a quadratic control point. */
function smoothPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length <= 2) {
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const control = points[i];
    const next = points[i + 1];
    const end = i === points.length - 2 ? next : { x: (control.x + next.x) / 2, y: (control.y + next.y) / 2 };
    d += ` Q${control.x},${control.y} ${end.x},${end.y}`;
  }
  return d;
}

function midpoint(points: Point[]): Point {
  const middle = points[Math.floor(points.length / 2)];
  return middle ?? { x: 0, y: 0 };
}

/**
 * dagre ends an edge on its node's bounding box; a diamond's box sticks out past its sides, so the
 * ends touching a decision are moved onto the diamond's edge.
 */
function trimToDiamonds(points: Point[], from: string, to: string, nodes: PositionedNode[]): Point[] {
  if (points.length < 2) {
    return points;
  }
  const result = [...points];
  const source = nodes.find((placed) => placed.node.id === from);
  const target = nodes.find((placed) => placed.node.id === to);
  if (source?.node.kind === "decision") {
    result[0] = diamondBoundary(source, result[1]);
  }
  if (target?.node.kind === "decision") {
    result[result.length - 1] = diamondBoundary(target, result[result.length - 2]);
  }
  return result;
}

/** Where the ray from the diamond's centre towards `toward` leaves the diamond. */
function diamondBoundary(placed: PositionedNode, toward: Point): Point {
  const dx = toward.x - placed.x;
  const dy = toward.y - placed.y;
  const extent = Math.abs(dx) / (placed.width / 2) + Math.abs(dy) / (placed.height / 2);
  if (extent === 0) {
    return { x: placed.x, y: placed.y - placed.height / 2 };
  }
  return { x: placed.x + dx / extent, y: placed.y + dy / extent };
}

/* ---------- legend ---------- */

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded bg-white/90 px-2 py-1 text-[11px] text-slate-600 shadow dark:bg-slate-700/90 dark:text-slate-300">
      <LegendItem
        shape={<rect x="1" y="2" width="14" height="10" rx="2" className={SHAPE_FILL.block} />}
        label="Instructions"
      />
      <LegendItem shape={<polygon points="8,1 15,7 8,13 1,7" className={SHAPE_FILL.decision} />} label="Condition" />
      <LegendItem shape={<polygon points="4,2 15,2 12,12 1,12" className={SHAPE_FILL.menu} />} label="Menu" />
      <LegendItem
        shape={<rect x="1" y="2" width="14" height="10" rx="4" className={SHAPE_FILL.handlers} />}
        label="Handlers"
      />
      <LegendItem
        shape={<rect x="1" y="2" width="14" height="10" rx="5" className={SHAPE_FILL.end} />}
        label="Start / stop"
      />
      <LegendItem
        shape={<line x1="1" y1="7" x2="15" y2="7" strokeWidth="2" className={EDGE_STROKE.yes} />}
        label="yes"
      />
      <LegendItem shape={<line x1="1" y1="7" x2="15" y2="7" strokeWidth="2" className={EDGE_STROKE.no} />} label="no" />
      <LegendItem
        shape={<line x1="1" y1="7" x2="15" y2="7" strokeWidth="2" strokeDasharray="3 2" className={EDGE_STROKE.jump} />}
        label="Goto"
      />
    </div>
  );
}

function LegendItem({ shape, label }: { shape: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <svg width="16" height="14" aria-hidden="true">
        {shape}
      </svg>
      {label}
    </span>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
