import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import type { FlowItem, LabelRef } from "../../script/controlFlow";
import { ActionRow, canJumpFrom } from "./ActionRow";

type VirtualActionListProps = {
  items: readonly FlowItem[];
  labelOwners: Map<LabelRef, string>;
  /** A line to scroll into view and mark, e.g. a search hit; a new object re-triggers the scroll. */
  reveal?: { line: number } | null;
  /** Whether line rows are indented by their block depth (the all-lines view). */
  indentByDepth?: boolean;
  onSelect: (id: string) => void;
  onJump: (label: LabelRef) => void;
};

/**
 * Scrollable list of action rows that only mounts the rows in view. Rows have varying heights
 * (wrapped text), so each one is measured after it renders.
 */
export function VirtualActionList({
  items,
  labelOwners,
  reveal,
  indentByDepth = false,
  onSelect,
  onJump,
}: VirtualActionListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Line number -> row index, for scrolling a line into view
  const rowOfLine = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach((item, index) => {
      if (item.kind === "line") {
        map.set(item.line.lineNumber, index);
      }
    });
    return map;
  }, [items]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 28,
    overscan: 12,
    getItemKey: (index) => {
      const item = items[index];
      return item.kind === "line" ? `line-${item.line.lineNumber}` : `node-${item.node.id}`;
    },
  });

  useEffect(() => {
    if (!reveal) {
      return;
    }
    const index = rowOfLine.get(reveal.line);
    if (index !== undefined) {
      virtualizer.scrollToIndex(index, { align: "center" });
    }
  }, [reveal, rowOfLine, virtualizer]);

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto pt-2 font-mono text-sm">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          const line = item.kind === "line" ? item.line : null;
          const revealed = line !== null && reveal?.line === line.lineNumber;
          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className={`absolute top-0 left-0 w-full ${revealed ? "ring-2 ring-inset ring-amber-400" : ""}`}
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <ActionRow
                item={item}
                indent={indentByDepth && line !== null ? line.depth : 0}
                canJump={line !== null && canJumpFrom(line, labelOwners)}
                onSelect={onSelect}
                onJump={onJump}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
