import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import type { FlowItem } from "../../script/controlFlow";
import { ActionRow, canJumpFrom } from "./ActionRow";
import { InsertLineRow } from "./InsertLineButton";
import type { LineEditing } from "./LineEditing";

type VirtualActionListProps = {
  items: readonly FlowItem[];
  lineIds: readonly number[];
  labelOwners: Map<number, string>;
  editing: LineEditing;
  editingLine: number | null;
  /** A line to scroll into view and mark, e.g. a search hit; a new object re-triggers the scroll. */
  reveal?: { line: number } | null;
  /** Line number the insert button after the last row creates. */
  trailingInsertLine: number;
  /** Whether line rows are indented by their block depth (the all-lines view). */
  indentByDepth?: boolean;
  onSelect: (id: string) => void;
  onJump: (label: number) => void;
};

/**
 * Scrollable list of action rows that only mounts the rows in view. Rows have varying heights
 * (wrapped text, open text fields), so each one is measured after it renders.
 */
export function VirtualActionList({
  items,
  lineIds,
  labelOwners,
  editing,
  editingLine,
  reveal,
  trailingInsertLine,
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
      return item.kind === "line" ? `line-${lineIds[item.line.lineNumber - 1]}` : `node-${item.node.id}`;
    },
  });

  // Moving the edit to the next line (Enter) must keep the field in view, or focus is lost
  useEffect(() => {
    if (editingLine === null) {
      return;
    }
    const index = rowOfLine.get(editingLine);
    if (index !== undefined) {
      virtualizer.scrollToIndex(index, { align: "auto" });
    }
  }, [editingLine, rowOfLine, virtualizer]);

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
                isEditing={line !== null && editingLine === line.lineNumber}
                canJump={line !== null && canJumpFrom(line, labelOwners)}
                editing={editing}
                onSelect={onSelect}
                onJump={onJump}
              />
            </div>
          );
        })}
      </div>
      <InsertLineRow lineNumber={trailingInsertLine} editing={editing} />
    </div>
  );
}
