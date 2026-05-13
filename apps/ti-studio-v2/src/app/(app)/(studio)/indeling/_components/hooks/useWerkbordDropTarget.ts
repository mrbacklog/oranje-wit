"use client";

/**
 * useWerkbordDropTarget — wraps PDND dropTargetForElements()
 *
 * Gebruik:
 *   const { ref, isOver } = useWerkbordDropTarget({
 *     doelBron: `team-${teamId}`,
 *     onDrop: (data) => verplaatsSpeler(data),
 *   });
 *   <div ref={ref} style={{ outline: isOver ? '2px solid ...' : 'none' }} />
 *
 * canDrop: blokkeert als source.type !== "speler" of als bron === doelBron.
 * Library-wissel: vervang alleen deze hook, niet de consumers.
 */

import { useEffect, useRef, useState } from "react";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import type { WerkbordDragData, DragBron } from "./useWerkbordDraggable";

interface UseWerkbordDropTargetOptions {
  /** De bron-identifier van dit drop-target — drop op zelfde bron is no-op */
  doelBron: DragBron;
  onDrop: (data: WerkbordDragData) => void;
  disabled?: boolean;
}

interface UseWerkbordDropTargetResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isOver: boolean;
}

function isWerkbordDragData(data: Record<string, unknown>): data is WerkbordDragData {
  return (
    data["type"] === "speler" &&
    typeof data["rel_code"] === "string" &&
    typeof data["bron"] === "string"
  );
}

export function useWerkbordDropTarget({
  doelBron,
  onDrop,
  disabled = false,
}: UseWerkbordDropTargetOptions): UseWerkbordDropTargetResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    return dropTargetForElements({
      element: el,
      canDrop: ({ source }) => {
        const data = source.data;
        if (!isWerkbordDragData(data)) return false;
        // Blokkeer drop op zelfde bron (no-op)
        return data.bron !== doelBron;
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: ({ source }) => {
        setIsOver(false);
        const data = source.data;
        if (isWerkbordDragData(data)) {
          onDrop(data);
        }
      },
    });
  }, [doelBron, onDrop, disabled]);

  return { ref, isOver };
}
